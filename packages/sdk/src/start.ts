import { checkOpencodeMinVersion, opencode } from './opencode.ts';
import { startWhatcode } from './server.ts';
import { getLocalIp } from './ip.ts';
import { startNotifications } from './apn/apn.ts';
import { identityStore } from './stores/identity.ts';
import { startTailscale } from './tailscale.ts';
import pkgJson from '../package.json' with { type: 'json' };
import { logger, type LogLevel } from '@goatjs/node/logger';

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
  const { client, version: opencodeVersion } = await opencode({ port: opencodePort, password });
  checkOpencodeMinVersion(opencodeVersion);
  const localIp = await getLocalIp();
  const opencodePublicUrl = `http://${localIp}:${opencodePort.toString()}`;
  const daemonUrl = `http://${localIp}:${port.toString()}`;
  startNotifications(client);
  await startWhatcode({ port, opencodePort: opencodePort, password, client });
  const tailscaleUrl = hasTailscale ? await startTailscale(port) : undefined;

  await identityStore.set({
    opencode: { url: opencodePublicUrl, version: opencodeVersion, available: !!hostname },
    daemon: { url: daemonUrl, version: pkgJson.version, available: true },
    tailscale: { url: tailscaleUrl, available: !!tailscaleUrl },
  });

  return { url: tailscaleUrl ?? daemonUrl };
};
