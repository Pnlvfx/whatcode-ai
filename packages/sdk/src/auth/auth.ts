import { relayClient } from './client.ts';
import { relayAuthStore } from '../stores/relay-auth.ts';
import { logger } from '../logger.ts';
import { headers } from './headers.ts';
import { machineId } from '../config/constants.ts';
import { identityName } from '../stores/identity.ts';

export const authenticate = () => {
  let retryCount = 1;

  const $auth = async () => {
    const stored = await relayAuthStore.get();
    if (stored.error || !stored.data) {
      if (stored.error) {
        logger.error('auth', stored.error.message);
      }
      const response = await relayClient.environment.pair.post({ machine_id: machineId, name: identityName });
      if (response.error) return { error: response.error };
      await relayAuthStore.set({ token: response.data.token });
      headers.set('x-api-key', `Bearer ${response.data.token}`);
    } else {
      const response = await relayClient.environment.get();
      if (response.error) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (retryCount === 1 && response.error.status === 401) {
          logger.debug('auth', 'Relay token no more valid, reauthenticating...');
          await relayAuthStore.clear();
          retryCount++;
          return $auth();
        }
        return { error: response.error };
      }
      headers.set('x-api-key', `Bearer ${stored.data.token}`);
    }

    return { data: { status: 'success' } };
  };

  return $auth();
};
