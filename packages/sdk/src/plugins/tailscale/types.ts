/* eslint-disable no-restricted-properties */
import * as z from 'zod/v4/mini';

export const tailscaleSchema = z.object({
  BackendState: z.string(),
  Self: z.optional(z.object({ DNSName: z.optional(z.string()) })),
});

export const serveStatusSchema = z.object({
  TCP: z.optional(z.record(z.string(), z.unknown())),
});
