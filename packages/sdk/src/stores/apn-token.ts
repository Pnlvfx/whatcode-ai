import * as z from 'zod';
import { createStore } from '../store.ts';
import { WHATCOME_AUTH } from '../config/config.ts';

export const apnTokenStore = await createStore('apn-token', z.strictObject({ userId: z.string(), token: z.string() }), { directory: WHATCOME_AUTH });
