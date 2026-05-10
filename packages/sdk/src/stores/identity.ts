import * as z from 'zod';
import { createStore } from '../store.ts';
import { WHATCODE_AUTH } from '../config/config.ts';

const persistedIdentitySchema = z.strictObject({ name: z.string() });

const identitySchema = z.strictObject({
  ...persistedIdentitySchema.shape,
  machineId: z.string(),
  opencodeUrl: z.string().optional(),
  daemonUrl: z.string().optional(),
  tailscaleUrl: z.string().optional(),
});

export const persistedIdentityStore = await createStore('identity', persistedIdentitySchema, { directory: WHATCODE_AUTH });

export type DaemonIdentity = z.infer<typeof identitySchema>;

let current: DaemonIdentity | undefined;

export const identityStore = {
  get: (): DaemonIdentity | undefined => current,
  set: (value: DaemonIdentity): void => {
    current = value;
  },
};
