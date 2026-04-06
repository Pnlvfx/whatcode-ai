import { homedir } from 'node:os';
import path from 'node:path';
import { logger } from '../logger.ts';

try {
  process.loadEnvFile();
} catch (err) {
  logger.error('env', 'Failed to load env file', err);
  // no .env file present, using defaults
}

export const CLIENT_URL = 'https://www.whatcode.app';
// eslint-disable-next-line no-restricted-properties
export const SERVER_URL = process.env['WHATCODE_SERVER_URL'] ?? 'https://api.whatcode.app';

export const WHATCODE_HOME = path.join(homedir(), '.whatcode');
export const WHATCODE_AUTH = path.join(WHATCODE_HOME, 'auth');
