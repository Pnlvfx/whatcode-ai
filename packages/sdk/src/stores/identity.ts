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

let current: DaemonIdentity | undefined;

export const identityStore = {
  get: (): DaemonIdentity => {
    if (!current) throw new Error('Identity not initialized');
    return current;
  },
  set: async ({ opencode, daemon, tailscale }: Pick<DaemonIdentity, 'opencode' | 'daemon' | 'tailscale'>): Promise<void> => {
    current = {
      name: os.hostname(),
      machineId: await mId.machineId(),
      opencode,
      daemon,
      tailscale,
    };
  },
};

export type DaemonIdentity = z.infer<typeof identitySchema>;
