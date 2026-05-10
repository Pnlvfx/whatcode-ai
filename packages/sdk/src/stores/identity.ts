import * as z from 'zod';

const identitySchema = z.strictObject({
  machineId: z.string(),
  opencodeUrl: z.string().optional(),
  daemonUrl: z.string().optional(),
  tailscaleUrl: z.string().optional(),
});

export type DaemonIdentity = z.infer<typeof identitySchema>;

let current: DaemonIdentity | undefined;

export const identityStore = {
  get: (): DaemonIdentity | undefined => current,
  set: (value: DaemonIdentity): void => {
    current = value;
  },
};
