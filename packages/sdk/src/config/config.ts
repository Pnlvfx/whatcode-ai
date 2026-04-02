import { homedir } from 'node:os';
import path from 'node:path';

export const CLIENT_URL = 'https://www.whatcode.app';
export const SERVER_URL = 'http://192.168.1.111:4192'; //  'https://api.whatcode.app'; TODO switch to the prod one

export const WHATCODE_HOME = path.join(homedir(), '.whatcode');
export const WHATCOME_AUTH = path.join(WHATCODE_HOME, 'auth');
