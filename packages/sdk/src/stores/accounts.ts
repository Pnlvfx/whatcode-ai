import * as z from 'zod/v4/mini';
import { WHATCODE_AUTH } from '../config/constants.ts';
import { createStore2 } from '../compiled/store/store2.ts';
import { logger } from '../compiled/node/logger.ts';

const accountSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  deviceId: z.string(),
  apnToken: z.optional(z.string()),
  deviceName: z.string(),
  token: z.string(),
});

const accountsStore = createStore2('accounts', z.array(accountSchema), { directory: WHATCODE_AUTH, initial: [] });

export const getAccounts = async () => {
  const { data, error } = await accountsStore.get();

  if (error) {
    await accountsStore.clear();
  }

  return data ?? [];
};

export const resetAccounts = accountsStore.clear;

export const addAccount = async (account: Account) => {
  const { error, data } = await accountsStore.set((prev) => [...prev, account]);

  // if (error) {
  //   await accountsStore.clear();
  // }

  return { error, data };
};

export const updateAccountApnToken = async ({ deviceId, apnToken }: { deviceId: string; apnToken: string }) => {
  const { data, error } = await accountsStore.set((prev) =>
    prev.map((p) => {
      if (p.deviceId !== deviceId) return p;
      logger.debug('apn-token', `Apn token updated for ${deviceId}`);
      return { ...p, apnToken };
    }),
  );

  // if (error) {
  //   await accountsStore.clear();
  // }

  return { data, error };
};

export const deleteAccount = async ({ deviceId }: { deviceId: string }) => {
  const { error, data } = await accountsStore.set((prev) => prev.map((e) => (e.deviceId === deviceId ? { ...e, apnToken: undefined } : e)));

  // if (error) {
  //   await accountsStore.clear();
  // }

  return { data, error };
};

export type Account = z.infer<typeof accountSchema>;
