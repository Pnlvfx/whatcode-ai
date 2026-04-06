import { createOpencodeClient, type ServerOptions } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { startWhatcode } from './server.ts';
import { tailscale, stopServe } from './tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { printQrCode } from './qrcode.ts';
import { getLocalIp } from './ip.ts';
import { startNotifications } from './experimentals/notifications.ts';
import { featureFlags } from './config/feature-flags.ts';
import { logger } from './logger.ts';
import { apnTokenStore } from './stores/apn-token.ts';
import mId from 'node-machine-id';
import { SERVER_URL } from './config/config.ts';

export interface WhatcodeServerConfig extends Omit<ServerOptions, 'config'> {
  tailscale?: boolean;
  password?: string;
  proxyPort?: number;
  proxy?: boolean;
  debug?: boolean;
}

export const createWhatcodeServer = async ({
  tailscale: useTailscale,
  password,
  proxyPort,
  proxy,
  debug = false,
  ...serverOptions
}: WhatcodeServerConfig) => {
  logger.init({ debug });
  const accounts = await apnTokenStore.get();
  const accountCount = accounts.length;
  logger.info('whatcode', `starting — ${accountCount.toString()} account${accountCount === 1 ? '' : 's'} connected`);
  const machineId = await mId.machineId();
  const { port: opencodePort } = await opencode({ ...(proxy ? {} : { hostname: '0.0.0.0' }), ...serverOptions });
  const resolvedPort = proxy ? (proxyPort ?? 8192) : opencodePort;
  const localIp = getLocalIp();
  const opencodeUrl = localIp ? `http://${localIp}:${opencodePort.toString()}` : undefined;
  const daemonUrl = localIp ? `http://${localIp}:${resolvedPort.toString()}` : undefined;

  logger.debug('relay', SERVER_URL);

  let tailscaleUrl: string | undefined;

  if (useTailscale) {
    tailscaleUrl = await tailscale(resolvedPort);
    asyncExitHook(
      async () => {
        await stopServe(resolvedPort);
      },
      { wait: 3000 },
    );
  }

  if (proxy) {
    const client = createOpencodeClient({ baseUrl: `http://localhost:${opencodePort.toString()}`, throwOnError: true });
    if (featureFlags.WHATCODE_NOTIFICATION) {
      startNotifications(client);
    }

    await startWhatcode({ port: resolvedPort, opencodePort, client, identity: { machineId, opencodeUrl, daemonUrl, tailscaleUrl } });
  }

  if (useTailscale && !proxy) {
    // keep the process running
    process.stdin.resume();
  }

  const advertiseUrl = tailscaleUrl ?? (proxy ? daemonUrl : opencodeUrl);
  if (advertiseUrl) {
    logger.info('whatcode', `use this URL in the app: ${advertiseUrl}`);
    printQrCode(advertiseUrl, password);
  } else {
    logger.info('whatcode', 'could not determine local IP — find your machine IP in your network settings and connect manually');
  }
};

export { resetWhatcodeServer } from './reset.ts';
