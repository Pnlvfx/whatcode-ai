import * as z from 'zod';
import { createStore } from '../store.ts';
import { WHATCODE_AUTH } from '../config/config.ts';

export const apnTokenStore = await createStore(
  'apn-token',
  z.array(z.strictObject({ userId: z.string(), deviceId: z.string(), token: z.string(), deviceName: z.string() })),
  { directory: WHATCODE_AUTH, initial: [] },
);
