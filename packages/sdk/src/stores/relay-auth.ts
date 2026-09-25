import * as z from 'zod/v4/mini';
import { createStore2 } from '../compiled/store/store2.ts';
import { WHATCODE_AUTH } from '../config/constants.ts';

const authSchema = z.strictObject({ token: z.string() });

export const relayAuthStore = createStore2('auth', authSchema, { directory: WHATCODE_AUTH });
