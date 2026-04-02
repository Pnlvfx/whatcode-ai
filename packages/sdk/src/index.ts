/* eslint-disable no-console */
import type { ServerOptions } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { tailscale } from './tailscale.ts';
import { printQrCode } from './qrcode.ts';
import { startNotifications } from './experimentals/notifications.ts';

export interface WhatcodeServerConfig extends Omit<ServerOptions, 'config'> {
  tailscale?: boolean;
  notification?: boolean;
  password?: string;
}

export const createWhatcodeServer = async ({ tailscale: useTailscale, notification, password, ...serverOptions }: WhatcodeServerConfig) => {
  const opencodeUrl = await opencode(serverOptions);
  if (notification) {
    startNotifications();
  }
  if (useTailscale) {
    const url = await tailscale();
    console.log('[tailscale] running');
    console.log(`[tailscale] use this URL in the app: ${url}`);
    printQrCode(url, password);
  } else {
    console.log('[opencode] running');
    console.log(`[opencode] detected local address: ${opencodeUrl} — if wrong, restart with --hostname <your-ip>`);
    printQrCode(opencodeUrl, password);
  }
};
