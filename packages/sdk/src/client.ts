// TODO [2026-08-08] Eysia type portability issue
// eslint-disable-next-line sonarjs/no-internal-api-use
import type * as _ from '../../../node_modules/@elysia/eden/dist/types.js';
import type { App } from '@/server/server';
import { treaty } from '@elysia/eden/treaty2';
import { SERVER_URL } from './config/constants.ts';

/** @ts-expect-error type mismatch */
export const relayClient = treaty<App>(SERVER_URL);
