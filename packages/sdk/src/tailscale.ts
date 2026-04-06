/* eslint-disable no-restricted-properties */
import { execa } from 'execa';
import { platform } from './config/constants.ts';
import * as z from 'zod';

export const tailscale = async (port: number): Promise<string> => {
  await assertTailscaleInstalled();
  await assertDaemonReachable();
  const hostname = await getHostname();
  const already = await isServeRunning(port);
  if (!already) await startServe(port);
  const url = `https://${hostname.replace(/-$/, '')}`;
  return url;
};

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
  await execa('tailscale', ['serve', '--bg', port.toString()], { stdio: 'inherit' });
};

export const stopServe = async (port: number): Promise<void> => {
  try {
    // Remove only our specific port rule — avoids clobbering other users' ports
    await execa('tailscale', ['serve', 'off', port.toString()]);
  } catch {
    // best-effort — if tailscale is already gone, nothing to do
  }
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
    await execa(getCheckCommand(), [cmd]);
    return true;
  } catch {
    return false;
  }
};

const getCheckCommand = () => {
  // TODO add ubuntu, i think the only diff is win
  switch (platform) {
    case 'win32': {
      return 'where';
    }
    case 'darwin': {
      return 'which';
    }
    default: {
      throw new Error('Unsupported platform');
    }
  }
};
