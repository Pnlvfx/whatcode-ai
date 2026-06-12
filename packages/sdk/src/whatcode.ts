import { checkOpencodeMinVersion, opencode } from './opencode.ts';
import { startWhatcode } from './server.ts';
import { identityStore } from './stores/identity.ts';
import { asyncExitHook } from 'exit-hook';
import { getLocalIp } from './ip.ts';
import { startNotifications } from './plugins/notifications.ts';
import { logger, type LogLevel } from './logger.ts';
import { apnTokenStore } from './stores/apn-token.ts';
import { createTailscale } from './plugins/tailscale.ts';
import { SERVER_URL } from './config/constants.ts';
import mId from 'node-machine-id';

export interface WhatcodeServerResult {
  url: string | undefined;
}

export interface WhatcodeServerConfig {
  tailscale?: boolean;
  password?: string;
  port?: number;
  opencodePort?: number;
  logLevel?: LogLevel;
}

export const createWhatcodeServer = async ({
  tailscale: hasTailscale,
  password,
  port = 8192,
  opencodePort = 4096,
  logLevel = 'none',
}: WhatcodeServerConfig = {}): Promise<WhatcodeServerResult> => {
  logger.init({ logLevel });
  const accounts = await apnTokenStore.get();
  const accountCount = accounts.length;
  logger.info('whatcode', `starting — ${accountCount.toString()} account${accountCount === 1 ? '' : 's'} connected`);
  const machineId = await mId.machineId();
  const { client, version: opencodeVersion } = await opencode({ port: opencodePort, password });
  checkOpencodeMinVersion(opencodeVersion);
  const localIp = await getLocalIp();

  if (localIp) {
    logger.debug('local ip', localIp);
  }

  const opencodePublicUrl = localIp ? `http://${localIp}:${opencodePort.toString()}` : undefined;
  const daemonUrl = localIp ? `http://${localIp}:${port.toString()}` : undefined;

  logger.debug('relay', SERVER_URL);

  identityStore.set({ machineId, opencodeUrl: opencodePublicUrl, daemonUrl });

  startNotifications(client);

  await startWhatcode({ port, opencodePort: opencodePort, password, client });

  if (hasTailscale) {
    const tailscale = createTailscale(port);
    const result = await tailscale.start();
    identityStore.set({ machineId, opencodeUrl: opencodePublicUrl, daemonUrl, tailscaleUrl: result.url });
    logger.debug('tailscale', 'we own the serve — registering exit hook to stop it');
    asyncExitHook(tailscale.stop, { wait: 3000 });
  }

  const url = identityStore.get()?.tailscaleUrl ?? daemonUrl;
  return { url };
};

export const resetWhatcodeServer = async () => {
  await apnTokenStore.clear();
};
