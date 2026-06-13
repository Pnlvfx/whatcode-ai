// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import * as z from 'zod/v4/mini';
import { identityStore } from '../../stores/identity.ts';

const router = Router();

router.get('/', (_req, res) => {
  const { name, daemon, machineId, opencode, tailscale } = identityStore.get();
  res.status(200).json({
    data: { machineId, name, opencodeUrl: opencode.url, daemonUrl: daemon.url, tailscaleUrl: tailscale.url } satisfies DaemonIdentity & {
      name: string;
    },
  });
});

export { router as identityRouter };

/** deprecated v1 identity endpoint must satisfy this schema */

const identitySchema = z.strictObject({
  machineId: z.string(),
  opencodeUrl: z.optional(z.string()),
  daemonUrl: z.optional(z.string()),
  tailscaleUrl: z.optional(z.string()),
});

export type DaemonIdentity = z.infer<typeof identitySchema>;
