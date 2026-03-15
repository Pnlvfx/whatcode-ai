import { opencode } from './opencode.ts';
import { tailscale } from './tailscale.ts';

export interface WhatcodeServerConfig {
  tailscale?: boolean;
}

export const createWhatcodeServer = async (config: WhatcodeServerConfig) => {
  await opencode();
  if (config.tailscale) {
    await tailscale();
  }
};
