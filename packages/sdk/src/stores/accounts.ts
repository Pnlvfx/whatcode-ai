import * as z from 'zod/v4/mini';
import { WHATCODE_AUTH } from '../config/constants.ts';
import { createStore } from '../compiled/store/store.ts';

const accountSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  deviceId: z.string(),
  apnToken: z.optional(z.string()),
  deviceName: z.string(),
  token: z.string(),
});

export const accountsStore = await createStore('accounts', z.array(accountSchema), { directory: WHATCODE_AUTH, initial: [], onCorrupted: 'delete' });

export type Account = z.infer<typeof accountSchema>;
