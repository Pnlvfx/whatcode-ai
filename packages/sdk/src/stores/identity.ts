import * as z from 'zod/v4/mini';

const identitySchema = z.strictObject({
  machineId: z.string(),
  opencodeUrl: z.optional(z.string()),
  daemonUrl: z.optional(z.string()),
  tailscaleUrl: z.optional(z.string()),
});

export type DaemonIdentity = z.infer<typeof identitySchema>;

let current: DaemonIdentity | undefined;

export const identityStore = {
  get: (): DaemonIdentity | undefined => current,
  set: (value: DaemonIdentity): void => {
    current = value;
  },
};
