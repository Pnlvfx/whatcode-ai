import os from 'node:os';
import path from 'node:path';

export const platform = os.platform();

const REAL_SERVER_URL = 'https://api.whatcode.app';

// eslint-disable-next-line no-restricted-properties
export const SERVER_URL = process.env['WHATCODE_SERVER_URL'] ?? REAL_SERVER_URL;

const devFolder = SERVER_URL === REAL_SERVER_URL ? '' : 'dev';
const WHATCODE_HOME = path.join(os.homedir(), '.whatcode');
const rootPath = path.join(WHATCODE_HOME, devFolder);
export const WHATCODE_AUTH = path.join(rootPath, 'auth');
