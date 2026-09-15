import { relayClient } from './client.ts';
import { logger } from './logger.ts';

export const getFeatureFlags = async () => {
  const { error, data } = await relayClient['feature-flags'].get();
  if (error) {
    logger.warn('flags', 'Feature flags request failed: starting without flags.');
    return;
  }
  return data.flags;
};
