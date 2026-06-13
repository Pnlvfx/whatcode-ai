import type { Tailscale } from './plugins/tailscale/tailscale.ts';
import { logger } from '@goatjs/node/logger';

export const startTailscale = async (tailscale: Tailscale) => {
  const result = await tailscale.start();
  logger.debug('tailscale', 'registered  — registering exit hook to stop it');
  return result.url;
};
