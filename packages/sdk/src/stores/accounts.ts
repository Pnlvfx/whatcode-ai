import * as z from 'zod/v4/mini';
import { WHATCODE_AUTH } from '../config/constants.ts';
import { createStore2 } from '../compiled/store/store2.ts';
import { logger } from '../logger.ts';

const accountSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  deviceId: z.string(),
  deviceName: z.string(),
  token: z.string(),
});

const accountsStore = createStore2('accounts', z.array(accountSchema), { directory: WHATCODE_AUTH, initial: [] });

const validationResult = await accountsStore.validate();
if (validationResult.error) {
  logger.warn('accounts', 'Accounts schema changed, resetting...');
  await accountsStore.clear();
}

export const getAccounts = accountsStore.get;
export const addAccount = (account: Account) => accountsStore.set((prev) => [...prev, account]);
export const deleteAccount = (account: Account) => accountsStore.set((prev) => prev.filter((a) => a.id === account.id));
export const resetAccounts = accountsStore.clear;

export type Account = z.infer<typeof accountSchema>;
