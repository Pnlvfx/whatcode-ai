import * as z from 'zod/v4/mini';
import { WHATCODE_AUTH } from '../config/constants.ts';
import { createStore } from '../compiled/store/store.ts';

/** @deprecated */
export const apnTokenStore = await createStore(
  'apn-token',
  z.array(z.strictObject({ userId: z.string(), deviceId: z.string(), token: z.string(), deviceName: z.string() })),
  { directory: WHATCODE_AUTH, initial: [] },
);
