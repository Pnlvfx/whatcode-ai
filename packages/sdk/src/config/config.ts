/* eslint-disable no-restricted-properties */
import * as z from 'zod';
import { logger } from '../logger.ts';

try {
  process.loadEnvFile();
} catch {
  logger.debug('env', 'no .env file present, using defaults');
}

const envSchema = z.strictObject({
  WHATCODE_SERVER_URL: z.string().optional(),
});

export const config = await envSchema.parseAsync({
  WHATCODE_SERVER_URL: process.env['WHATCODE_SERVER_URL'],
});
