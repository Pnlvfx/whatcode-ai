/* eslint-disable no-console */
import type { ServerOptions } from '@opencode-ai/sdk/v2';
import { opencode, getLocalUrl } from './opencode.ts';
import { tailscale } from './tailscale.ts';
import { printQrCode } from './qrcode.ts';
import { startNotifications } from './experimentals/notifications.ts';
export { saveToken } from './experimentals/notifications.ts';

export interface WhatcodeServerConfig extends Omit<ServerOptions, 'config'> {
  tailscale?: boolean;
  notification?: boolean;
}

export const createWhatcodeServer = async ({ tailscale: useTailscale, notification, ...serverOptions }: WhatcodeServerConfig) => {
  await opencode(serverOptions);
  if (notification) {
    startNotifications();
  }
  if (useTailscale) {
    const url = await tailscale();
    console.log('[tailscale] running');
    console.log(`[tailscale] use this URL in the app: ${url}`);
    printQrCode(url);
  } else {
    const url = getLocalUrl();
    console.log('[opencode] running');
    console.log(`[opencode] use this URL in the app: ${url}`);
    printQrCode(url);
  }
};
