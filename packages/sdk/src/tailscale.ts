import type { Tailscale } from './plugins/tailscale/tailscale.ts';
import { logger } from './logger.ts';

export const startTailscale = async (tailscale: Tailscale) => {
  const { url } = await tailscale.start();
  logger.debug('tailscale', `url: ${url}`);
  return url;
};
