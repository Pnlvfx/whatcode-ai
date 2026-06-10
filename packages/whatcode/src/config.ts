/* eslint-disable no-restricted-properties */
import * as z from 'zod/v4/mini';

try {
  process.loadEnvFile();
} catch {}

const envSchema = z.strictObject({
  WHATCODE_SERVER_URL: z.optional(z.string()),
  WHATCODE_PASSWORD: z.optional(z.string()),
});

export const config = await envSchema.parseAsync({
  WHATCODE_SERVER_URL: process.env['WHATCODE_SERVER_URL'],
  WHATCODE_PASSWORD: process.env['WHATCODE_PASSWORD'],
});
