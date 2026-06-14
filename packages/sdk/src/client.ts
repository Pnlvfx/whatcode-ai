import type { App } from '@/server/server';
import { treaty } from '@elysia/eden';
import { SERVER_URL } from './config/constants.ts';

export const relayClient = treaty<App>(SERVER_URL, { throwHttpError: true });
