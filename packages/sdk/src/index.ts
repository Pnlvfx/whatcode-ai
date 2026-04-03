/* eslint-disable no-console */
import { createOpencodeClient, type ServerOptions } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { startProxy } from './server.ts';
import { tailscale, stopServe } from './tailscale.ts';
import { printQrCode } from './qrcode.ts';
import { getLocalUrl } from './ip.ts';
import { startNotifications } from './experimentals/notifications.ts';
import { featureFlags } from './config/feature-flags.ts';

export interface WhatcodeServerConfig extends Omit<ServerOptions, 'config'> {
  tailscale?: boolean;
  password?: string;
  proxyPort?: number;
  proxy?: boolean;
}

export const createWhatcodeServer = async ({ tailscale: useTailscale, password, proxyPort, proxy, ...serverOptions }: WhatcodeServerConfig) => {
  const { port: opencodePort } = await opencode({ ...(proxy ? {} : { hostname: '0.0.0.0' }), ...serverOptions });
  const resolvedPort = proxy ? (proxyPort ?? 8192) : opencodePort;

  if (proxy) {
    const client = createOpencodeClient({ baseUrl: `http://localhost:${opencodePort.toString()}`, throwOnError: true });
    if (featureFlags.WHATCODE_NOTIFICATION) {
      startNotifications(client);
    }
    await startProxy({ port: resolvedPort, opencodePort, client });
  }

  const url = useTailscale ? await tailscale(resolvedPort) : getLocalUrl(resolvedPort);

  if (useTailscale) {
    // Stop only our specific port when the process exits — avoids leaving stale
    // tailscale serve rules behind, and avoids clobbering other users' ports.
    const cleanup = () => {
      void stopServe(resolvedPort);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  }

  if (useTailscale && !proxy) {
    // When tailscale is enabled but no proxy (express) is running, Node has nothing
    // keeping the event loop alive — the process would exit immediately and tear down
    // the serve before the user is done. Resuming stdin prevents that.
    process.stdin.resume();
  }

  console.log(`[whatcode] use this URL in the app: ${url}`);
  printQrCode(url, password);
};
