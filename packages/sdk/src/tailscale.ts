/* eslint-disable no-console */
import { execa } from 'execa';
import { platform } from './constants.ts';

export const tailscale = async () => {
  await assertTailscaleInstalled();
  await assertDaemonReachable();
  const hostname = await getHostname();
  await startServe();
  console.log('[tailscale] running');
  console.log(`[tailscale] use this URL in the app:\nhttps://${hostname.replace(/-$/, '')}`);
};

const startServe = async (): Promise<void> => {
  // tailscale serve proxies localhost:4096 over HTTPS on the tailnet hostname
  // this runs in the background — the process exits after setting up the config
  await execa('tailscale', ['serve', '--bg', '4096'], { stdio: 'inherit' });
};

const getHostname = async (): Promise<string> => {
  const { stdout } = await execa('tailscale', ['status', '--json']);
  const data = JSON.parse(stdout) as {
    BackendState: string;
    Self: { DNSName: string | undefined } | undefined;
  };
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
