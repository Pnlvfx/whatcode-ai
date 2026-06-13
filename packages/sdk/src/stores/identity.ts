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

let current: DaemonIdentityV2 | undefined;

export const identityStore = {
  get: (): DaemonIdentityV2 => {
    if (!current) throw new Error('Identity not initialized');
    return current;
  },
  set: async ({ opencode, daemon, tailscale }: Pick<DaemonIdentityV2, 'opencode' | 'daemon' | 'tailscale'>): Promise<void> => {
    current = {
      name: os.hostname(),
      machineId: await mId.machineId(),
      opencode,
      daemon,
      tailscale,
    };
  },
};

export type DaemonIdentityV2 = z.infer<typeof identitySchema>;
