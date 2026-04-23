import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { startWhatcode } from './server.ts';
import { identityStore } from './stores/identity.ts';
import { asyncExitHook } from 'exit-hook';
import { printQrCode } from './qrcode.ts';
import { getLocalIp } from './ip.ts';
import { startNotifications } from './experimentals/notifications.ts';
import { featureFlags } from './config/feature-flags.ts';
import { logger } from './logger.ts';
import { apnTokenStore } from './stores/apn-token.ts';
import mId from 'node-machine-id';
import { SERVER_URL } from './config/config.ts';
import { tailscale } from './plugins/tailscale.ts';

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
}: WhatcodeServerConfig = {}) => {
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

  const client = createOpencodeClient({ baseUrl: `http://localhost:${opencodePort.toString()}`, throwOnError: true });

  if (featureFlags.WHATCODE_NOTIFICATION) {
    startNotifications(client);
  }

  await startWhatcode({ port, opencodePort: opencodePort, password, client });

  if (useTailscale) {
    const result = await tailscale.start(port);
    identityStore.set({ machineId, opencodeUrl, daemonUrl, tailscaleUrl: result.url });
    logger.debug('tailscale', 'we own the serve — registering exit hook to stop it');
    asyncExitHook(
      async () => {
        await tailscale.stop(port);
      },
      { wait: 3000 },
    );
  }

  const advertiseUrl = identityStore.get()?.tailscaleUrl ?? daemonUrl;
  if (advertiseUrl) {
    logger.info('whatcode', `use this URL in the app: ${advertiseUrl}`);
    printQrCode(advertiseUrl, password);
  } else {
    logger.info('whatcode', 'could not determine local IP — find your machine IP in your network settings and connect manually');
  }
};

export const resetWhatcodeServer = async () => {
  await apnTokenStore.clear();
};
