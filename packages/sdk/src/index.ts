/* eslint-disable no-console */
import type { ServerOptions } from '@opencode-ai/sdk/v2';
import type { ProxyRoute } from './proxy.ts';
import { opencode } from './opencode.ts';
import { startProxy } from './proxy.ts';
import { tailscale } from './tailscale.ts';
import { printQrCode } from './qrcode.ts';
import { getLocalUrl } from './ip.ts';
import { startNotifications } from './experimentals/notifications.ts';

export interface WhatcodeServerConfig extends Omit<ServerOptions, 'config'> {
  tailscale?: boolean;
  notification?: boolean;
  password?: string;
  proxyPort?: number;
  routes?: ProxyRoute[];
  proxy?: boolean;
}

export const createWhatcodeServer = async ({
  tailscale: useTailscale,
  notification,
  password,
  proxyPort,
  routes,
  proxy,
  ...serverOptions
}: WhatcodeServerConfig) => {
  const opencodeHost = proxy ? undefined : '0.0.0.0';
  const { port: opencodePort } = await opencode({ hostname: opencodeHost, ...serverOptions });
  const resolvedPort = proxy ? (proxyPort ?? opencodePort + 1) : opencodePort;

  if (proxy) {
    await startProxy({ opencodePort, proxyPort: resolvedPort, routes });
  }

  if (notification) {
    startNotifications();
  }

  const url = useTailscale ? await tailscale(resolvedPort) : getLocalUrl(resolvedPort);

  console.log('[whatcode] running');
  console.log(`[whatcode] use this URL in the app: ${url}`);
  printQrCode(url, password);
};
