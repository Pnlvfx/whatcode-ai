import type { App } from '@/server/server';
import { hc } from '../compiled/eden/hc.ts';
import { SERVER_URL } from '../config/constants.ts';
import { headers } from './headers.ts';

export const relayClient = hc<App>(SERVER_URL, { headers: () => Object.fromEntries(headers) });
