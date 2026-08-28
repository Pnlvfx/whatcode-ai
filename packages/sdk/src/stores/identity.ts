import { createStore2 } from '../compiled/store/store2.ts';
import mId from 'node-machine-id';
import * as z from 'zod/v4/mini';
import os from 'node:os';

const providerIdentitySchema = z.strictObject({ url: z.string(), version: z.string(), available: z.boolean() });

const identitySchema = z.strictObject({
  name: z.string(),
  machineId: z.string(),
  opencode: providerIdentitySchema,
  daemon: providerIdentitySchema,
  tailscale: z.strictObject({ url: z.optional(z.string()), available: z.boolean() }),
});

const identityStore = createStore2('identity', identitySchema, { persist: false, directory: '' });

export const getIdentity = async () => {
  const identity = await identityStore.get();
  if (identity.error) return { error: identity.error };
  if (!identity.data) return { error: { type: 'identity-init' as const, message: 'Identity not initialized!' } };
  return { data: identity.data };
};

export const createIdentity = async ({ opencode, daemon, tailscale }: Pick<DaemonIdentity, 'opencode' | 'daemon' | 'tailscale'>) => {
  return identityStore.set({
    name: os.hostname(),
    machineId: await mId.machineId(),
    opencode,
    daemon,
    tailscale,
  });
};

export type DaemonIdentity = z.infer<typeof identitySchema>;
