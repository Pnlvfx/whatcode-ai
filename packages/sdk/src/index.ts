/* eslint-disable no-console */
import { createOpencodeClient, type ServerOptions } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { startWhatcode } from './server.ts';
import { tailscale, stopServe } from './tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { printQrCode } from './qrcode.ts';
import { getLocalUrl } from './ip.ts';
import { startNotifications } from './experimentals/notifications.ts';
import { featureFlags } from './config/feature-flags.ts';
import mId from 'node-machine-id';

export interface WhatcodeServerConfig extends Omit<ServerOptions, 'config'> {
  tailscale?: boolean;
  password?: string;
  proxyPort?: number;
  proxy?: boolean;
}

export const createWhatcodeServer = async ({ tailscale: useTailscale, password, proxyPort, proxy, ...serverOptions }: WhatcodeServerConfig) => {
  const machineId = await mId.machineId();
  const { port: opencodePort } = await opencode({ ...(proxy ? {} : { hostname: '0.0.0.0' }), ...serverOptions });
  const resolvedPort = proxy ? (proxyPort ?? 8192) : opencodePort;
  const opencodeUrl = getLocalUrl(opencodePort);
  const daemonUrl = getLocalUrl(resolvedPort);

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
    process.stdin.resume();
  }

  // The URL to advertise is the most capable one available
  const advertiseUrl = tailscaleUrl ?? (proxy ? daemonUrl : opencodeUrl);
  console.log(`[whatcode] use this URL in the app: ${advertiseUrl}`);
  printQrCode(advertiseUrl, password);
};
