import os, { homedir } from 'node:os';
import path from 'node:path';
import { config } from './config.ts';

export const platform = os.platform();

const REAL_SERVER_URL = 'https://api.whatcode.app';

export const SERVER_URL = config.WHATCODE_SERVER_URL ?? REAL_SERVER_URL;

const devFolder = SERVER_URL === REAL_SERVER_URL ? 'dev' : '';
const WHATCODE_HOME = path.join(homedir(), '.whatcode');
const rootPath = path.join(WHATCODE_HOME, devFolder);
export const WHATCODE_AUTH = path.join(rootPath, 'auth');
