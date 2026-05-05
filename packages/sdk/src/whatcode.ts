import type { LogLevel } from './logger.ts';
import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { startWhatcode } from './server.ts';
import { identityStore } from './stores/identity.ts';
import { asyncExitHook } from 'exit-hook';
import { getLocalIp } from './ip.ts';
import { startNotifications } from './plugins/notifications.ts';
import { logger } from './logger.ts';
import { apnTokenStore } from './stores/apn-token.ts';
import { SERVER_URL } from './config/config.ts';
import { createTailscale } from './plugins/tailscale.ts';
import os from 'node:os';
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
  tailscale: useTailscale,
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
  await opencode({ port: opencodePort, password });
  const localIp = await getLocalIp();
  if (!localIp) logger.warn('whatcode', 'could not determine local IP — local URLs will be unavailable');
  const opencodeUrl = localIp ? `http://${localIp}:${opencodePort.toString()}` : undefined;
  const daemonUrl = localIp ? `http://${localIp}:${port.toString()}` : undefined;
  const accountName = os.platform();

  logger.debug('relay', SERVER_URL);

  identityStore.set({ machineId, opencodeUrl, daemonUrl, name: accountName });

  const opencodeAuthHeader = password ? `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}` : undefined;
  const client = createOpencodeClient({
    baseUrl: `http://localhost:${opencodePort.toString()}`,
    throwOnError: true,
    ...(opencodeAuthHeader ? { headers: { authorization: opencodeAuthHeader } } : {}),
  });

  startNotifications(client);

  await startWhatcode({ port, opencodePort: opencodePort, password, client });

  if (useTailscale) {
    const tailscale = createTailscale(port);
    const result = await tailscale.start();
    identityStore.set({ machineId, opencodeUrl, daemonUrl, tailscaleUrl: result.url, name: accountName });
    logger.debug('tailscale', 'we own the serve — registering exit hook to stop it');
    asyncExitHook(tailscale.stop, { wait: 3000 });
  }

  const url = identityStore.get()?.tailscaleUrl ?? daemonUrl;
  return { url };
};

export const resetWhatcodeServer = async () => {
  await apnTokenStore.clear();
};
