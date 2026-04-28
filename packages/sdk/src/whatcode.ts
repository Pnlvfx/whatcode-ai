import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { startWhatcode } from './server.ts';
import { identityStore } from './stores/identity.ts';
import { asyncExitHook } from 'exit-hook';
import { getLocalIp } from './ip.ts';
import { startNotifications } from './plugins/notifications.ts';
import { logger } from './logger.ts';
import { apnTokenStore } from './stores/apn-token.ts';
import mId from 'node-machine-id';
import { SERVER_URL } from './config/config.ts';
import { createTailscale } from './plugins/tailscale.ts';

export interface WhatcodeServerResult {
  url: string | undefined;
}

export interface WhatcodeServerConfig {
  tailscale?: boolean;
  password?: string;
  port?: number;
  opencodePort?: number;
  debug?: boolean;
}

export const createWhatcodeServer = async ({
  tailscale: useTailscale,
  password,
  port = 8192,
  opencodePort = 4096,
  debug = false,
}: WhatcodeServerConfig = {}): Promise<WhatcodeServerResult> => {
  logger.init({ debug });
  const accounts = await apnTokenStore.get();
  const accountCount = accounts.length;
  logger.info('whatcode', `starting — ${accountCount.toString()} account${accountCount === 1 ? '' : 's'} connected`);
  const machineId = await mId.machineId();
  await opencode({ port: opencodePort, password });
  const localIp = getLocalIp();
  const opencodeUrl = localIp ? `http://${localIp}:${opencodePort.toString()}` : undefined;
  const daemonUrl = localIp ? `http://${localIp}:${port.toString()}` : undefined;

  logger.debug('relay', SERVER_URL);

  identityStore.set({ machineId, opencodeUrl, daemonUrl });

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
    identityStore.set({ machineId, opencodeUrl, daemonUrl, tailscaleUrl: result.url });
    logger.debug('tailscale', 'we own the serve — registering exit hook to stop it');
    asyncExitHook(tailscale.stop, { wait: 3000 });
  }

  const url = identityStore.get()?.tailscaleUrl ?? daemonUrl;
  return { url };
};

export const resetWhatcodeServer = async () => {
  await apnTokenStore.clear();
};
