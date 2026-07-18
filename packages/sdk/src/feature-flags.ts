import { relayClient } from './client.ts';

export const getFeatureFlags = async () => {
  const { error, data } = await relayClient['feature-flags'].get();
  if (error) return;
  return data.flags;
};
