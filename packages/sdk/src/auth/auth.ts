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
      const response = await relayClient.environment.pair.$post({ json: { machine_id: machineId, name: identityName } });
      if (!response.ok) return { error: await response.json() };
      const { token } = await response.json();
      await relayAuthStore.set({ token });
      headers.set('x-api-key', `Bearer ${token}`);
    } else {
      headers.set('x-api-key', `Bearer ${stored.data.token}`);
      const response = await relayClient.environment.$get();
      if (!response.ok) {
        if (retryCount === 1 && response.status === 401) {
          logger.debug('auth', 'Relay token no more valid, reauthenticating...');
          await relayAuthStore.clear();
          retryCount++;
          return $auth();
        }
        return { error: await response.json() };
      }
    }

    return { data: { status: 'success' } };
  };

  return $auth();
};
