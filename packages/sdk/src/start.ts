import { checkOpencodeMinVersion, opencode } from './opencode/opencode.ts';
import { startWhatcode } from './server.ts';
import { getLocalIp } from './ip.ts';
import { startNotifications } from './apn/apn.ts';
import { identityStore } from './stores/identity.ts';
import { startTailscale } from './tailscale.ts';
import { createTailscale } from './plugins/tailscale/tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { logger, type LogLevel } from './compiled/node/logger.ts';
import pkgJson from '../package.json' with { type: 'json' };

export interface WhatcodeServerResult {
  url: string | undefined;
}

export interface WhatcodeServerConfig {
  tailscale?: boolean;
  password?: string;
  port?: number;
  opencodePort?: number;
  logLevel?: LogLevel;
  hostname?: string;
}

export const createWhatcodeServer = async ({
  tailscale: hasTailscale,
  password,
  port = 8192,
  opencodePort = 4096,
  logLevel = 'none',
  hostname,
}: WhatcodeServerConfig = {}): Promise<WhatcodeServerResult> => {
  logger.init({ logLevel });
  const { server: opencodeServer, client, version: opencodeVersion } = await opencode({ port: opencodePort, password, logLevel });
  checkOpencodeMinVersion(opencodeVersion);
  const localIp = hostname ?? (await getLocalIp());
  const opencodePublicUrl = `http://${localIp}:${opencodePort.toString()}`;
  const daemonUrl = `http://${localIp}:${port.toString()}`;
  startNotifications(client);
  startWhatcode({ port, opencodePort: opencodePort, password, client });
  const tailscale = hasTailscale ? createTailscale(port) : undefined;
  const tailscaleUrl = tailscale ? await startTailscale(tailscale) : undefined;

  await identityStore.set({
    opencode: { url: opencodePublicUrl, version: opencodeVersion, available: !!hostname },
    daemon: { url: daemonUrl, version: pkgJson.version, available: true },
    tailscale: { url: tailscaleUrl, available: !!tailscaleUrl },
  });

  // clean up
  asyncExitHook(
    async () => {
      await tailscale?.stop();
      opencodeServer?.close();
    },
    { wait: 3000 },
  );

  return { url: tailscaleUrl ?? daemonUrl };
};
