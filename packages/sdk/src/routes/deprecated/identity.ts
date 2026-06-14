import { Elysia } from 'elysia';
import * as z from 'zod/v4/mini';
import { identityStore } from '../../stores/identity.ts';

/** deprecated v1 identity endpoint must satisfy this schema */
const identitySchema = z.strictObject({
  machineId: z.string(),
  opencodeUrl: z.optional(z.string()),
  daemonUrl: z.optional(z.string()),
  tailscaleUrl: z.optional(z.string()),
});

type DaemonIdentity = z.infer<typeof identitySchema>;

/** @deprecated */
export const identityRouter = new Elysia({ prefix: '/whatcode' }).get('/identity', () => {
  const { name, daemon, machineId, opencode, tailscale } = identityStore.get();
  return {
    data: {
      machineId,
      name,
      opencodeUrl: opencode.url,
      daemonUrl: daemon.url,
      tailscaleUrl: tailscale.url,
    } satisfies DaemonIdentity & { name: string },
  };
});
