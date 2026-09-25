import { relayClient } from './client.ts';
import { relayAuthStore } from '../stores/relay-auth.ts';
import { logger } from '../logger.ts';
import { headers } from './headers.ts';
import { machineId } from '../config/constants.ts';

export const authenticate = async () => {
  const stored = await relayAuthStore.get();
  if (stored.error || !stored.data) {
    if (stored.error) {
      logger.error('auth', stored.error.message);
    }
    const response = await relayClient.environment.pair.post({ machine_id: machineId });
    if (response.error) return { error: response.error };
    await relayAuthStore.set({ token: response.data.token });
    headers.set('x-api-key', response.data.token);
  } else {
    const response = await relayClient.environment.get();
    if (response.error) return { error: response.error };
    headers.set('x-api-key', stored.data.token);
  }

  return { data: { status: 'success' } };
};
