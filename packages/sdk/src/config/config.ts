import { homedir } from 'node:os';
import path from 'node:path';

// eslint-disable-next-line no-restricted-properties
export const SERVER_URL = process.env['WHATCODE_SERVER_URL'] ?? 'https://api.whatcode.app';

const WHATCODE_HOME = path.join(homedir(), '.whatcode');
export const WHATCODE_AUTH = path.join(WHATCODE_HOME, 'auth');
