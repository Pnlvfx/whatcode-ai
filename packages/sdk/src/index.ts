import type { ServerOptions } from '@opencode-ai/sdk/v2';
import { opencode } from './opencode.ts';
import { tailscale } from './tailscale.ts';

export interface WhatcodeServerConfig extends Omit<ServerOptions, 'config'> {
  tailscale?: boolean;
}

export const createWhatcodeServer = async ({ tailscale: useTailscale, ...serverOptions }: WhatcodeServerConfig) => {
  await opencode(serverOptions);
  if (useTailscale) {
    await tailscale();
  }
};
