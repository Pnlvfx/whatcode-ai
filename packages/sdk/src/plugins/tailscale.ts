/* eslint-disable no-restricted-properties */
import { execa } from 'execa';
import * as z from 'zod';
import { logger } from '../logger.ts';
import { platform } from '../config/constants.ts';

export interface TailscaleResult {
  url: string;
}

const serveStatusSchema = z.object({
  TCP: z.record(z.string(), z.unknown()).optional(),
});

const isServeRunning = async (port: number): Promise<boolean> => {
  try {
    const { stdout } = await execa('tailscale', ['serve', 'status', '--json']);
    const result = serveStatusSchema.safeParse(JSON.parse(stdout));
    if (!result.success) return false;
    return Object.keys(result.data.TCP ?? {}).some((key) => key.includes(port.toString()));
  } catch {
    return false;
  }
};

const startServe = async (port: number): Promise<void> => {
  // tailscale serve proxies localhost:<port> over HTTPS on the tailnet hostname
  // this runs in the background — the process exits after setting up the config
  await execa('tailscale', ['serve', '--bg', port.toString()]);
};

const tailscaleSchema = z.object({
  BackendState: z.string(),
  Self: z.object({ DNSName: z.string().optional() }).optional(),
});

const getHostname = async (): Promise<string> => {
  const { stdout } = await execa('tailscale', ['status', '--json']);
  const data = await tailscaleSchema.parseAsync(JSON.parse(stdout));
  if (data.BackendState !== 'Running') {
    throw new Error(`[tailscale] unexpected state: ${data.BackendState} — run tailscale up to authenticate, then re-run`);
  }
  const hostname = data.Self?.DNSName?.replace(/\.$/, '');
  if (!hostname) throw new Error('[tailscale] could not determine hostname — run tailscale status');
  return hostname;
};

const assertDaemonReachable = async (): Promise<void> => {
  try {
    await execa('tailscale', ['status', '--json']);
  } catch {
    throw new Error('[tailscale] daemon is not reachable — make sure the tailscale service is running, then re-run');
  }
};

const assertTailscaleInstalled = async (): Promise<void> => {
  const installed = await checkCommand('tailscale');
  if (installed) return;
  switch (platform) {
    case 'darwin': {
      throw new Error('[tailscale] tailscale is not installed — install it with: brew install tailscale, then re-run');
    }
    case 'win32': {
      throw new Error('[tailscale] tailscale is not installed — install it with: choco install tailscale, then re-run');
    }
  }
};

const checkCommand = async (cmd: string): Promise<boolean> => {
  try {
    await execa(cmd, ['--version']);
    return true;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return !(error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT');
  }
};

export const createTailscale = (port: number) => {
  return {
    start: async (): Promise<TailscaleResult> => {
      await assertTailscaleInstalled();
      await assertDaemonReachable();
      const hostname = await getHostname();
      logger.debug('tailscale', `checking if serve is already running on port ${port.toString()}`);
      const isRunning = await isServeRunning(port);
      if (isRunning) {
        logger.debug('tailscale', `serve already running on port ${port.toString()} — skipping start`);
      } else {
        logger.debug('tailscale', `serve not running on port ${port.toString()} — starting`);
        await startServe(port);
        logger.debug('tailscale', `serve started — we own port ${port.toString()}`);
      }
      const url = `https://${hostname.replace(/-$/, '')}`;
      logger.debug('tailscale', `resolved url: ${url}`);
      return { url };
    },
    stop: async (): Promise<void> => {
      // tailscale serve proxies localhost:<port> over HTTPS on the tailnet hostname
      // this runs in the background — the process exits after setting up the config
      await execa('tailscale', ['serve', '--bg', port.toString()], { stdio: 'inherit' });
    },
  };
};
