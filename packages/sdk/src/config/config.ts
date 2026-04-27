import { homedir } from 'node:os';
import path from 'node:path';
import { logger } from '../logger.ts';

try {
  process.loadEnvFile();
} catch {
  logger.debug('env', 'Failed to load env file');
  // no .env file present, using defaults
}

// eslint-disable-next-line no-restricted-properties
export const SERVER_URL = process.env['WHATCODE_SERVER_URL'] ?? 'https://api.whatcode.app';

const WHATCODE_HOME = path.join(homedir(), '.whatcode');
export const WHATCODE_AUTH = path.join(WHATCODE_HOME, 'auth');
