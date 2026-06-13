import { asyncExitHook } from 'exit-hook';
import { createTailscale } from './plugins/tailscale/tailscale.ts';
import { logger } from '@goatjs/node/logger';

export const startTailscale = async (port: number) => {
  const tailscale = createTailscale(port);
  const result = await tailscale.start();
  logger.debug('tailscale', 'registered  — registering exit hook to stop it');
  // stop on process end
  asyncExitHook(tailscale.stop, { wait: 3000 });
  return result.url;
};
