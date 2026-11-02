import { createStore2 } from '../compiled/store/store2.ts';
import * as z from 'zod/v4/mini';
import os from 'node:os';
import { logger } from '../logger.ts';
import { machineId } from '../config/constants.ts';

export const identityName = os.hostname();

const identitySchema = z.strictObject({
  name: z.string(),
  machineId: z.string(),
  daemon: z.string(),
  tailscale: z.optional(z.string()),
  tunnel: z.optional(z.string()),
});

const identityStore = createStore2('identity', identitySchema, { persist: false, directory: '' });

const validationResult = await identityStore.validate();

if (validationResult.error) {
  logger.warn('identity', 'Identity schema changed, resetting...');
  await identityStore.clear();
}

export const getIdentity = async () => {
  const identity = await identityStore.get();
  if (identity.error) return { error: identity.error };
  return identity.data ? { data: identity.data } : { error: { type: 'identity-init' as const, message: 'Identity not initialized!' } };
};

export const createIdentity = async ({ daemon, tailscale, tunnel }: Pick<DaemonIdentity, 'daemon' | 'tailscale' | 'tunnel'>) => {
  return identityStore.set({ name: identityName, machineId, daemon, tailscale, tunnel });
};

export type DaemonIdentity = z.infer<typeof identitySchema>;
