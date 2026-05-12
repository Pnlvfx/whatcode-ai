/* eslint-disable no-restricted-properties */
import * as z from 'zod';

try {
  process.loadEnvFile();
} catch {}

const envSchema = z.strictObject({
  WHATCODE_SERVER_URL: z.string().optional(),
  WHATCODE_PASSWORD: z.string().optional(),
});

export const config = await envSchema.parseAsync({
  WHATCODE_SERVER_URL: process.env['WHATCODE_SERVER_URL'],
  WHATCODE_PASSWORD: process.env['WHATCODE_PASSWORD'],
});
