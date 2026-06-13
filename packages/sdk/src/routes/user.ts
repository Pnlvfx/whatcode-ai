import { createRouter, json, jsonResponse, unhautorized } from '@coraline/server';
import * as z from 'zod/v4/mini';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { accountsStore } from '../stores/accounts.ts';
import { pairUserBody } from '../types/user.ts';
import { identityStore } from '../stores/identity.ts';

const isTokenValid = (stored: string, incoming: string): boolean => {
  if (stored.length !== incoming.length) return false;
  return timingSafeEqual(Buffer.from(stored), Buffer.from(incoming));
};

export const userRouter = createRouter({
  middleware: [json()],
  handlers: (define) => ({
    pair: define({
      path: '/pair',
      method: 'post',
      validate: { body: pairUserBody },
      handler: async ({ body: { device_id, device_name } }) => {
        const accounts = await accountsStore.get();
        let account = accounts.find((a) => a.deviceId === device_id);
        if (!account) {
          account = {
            token: randomBytes(32).toString('hex'),
            userId: randomUUID(),
            deviceId: device_id,
            deviceName: device_name,
          };

          /** @ts-expect-error fuck you liar */
          await accountsStore.set((prev) => [...prev, account]);
        }
        return jsonResponse({ token: account.token, identity: identityStore.get() });
      },
    }),
    // getUser: define({
    //   path: '/',
    //   method: 'get',
    //   handler: async ({ userId }) => {
    //     const { name, daemon, machineId, opencode, tailscale } = identityStore.get();
    //     return {};
    //   },
    // }),
    // updateUser: define({
    //   path: '/update',
    //   method: 'post',
    //   handler: async () => {},
    // }),
    logout: define({
      path: '/logout',
      method: 'post',
      validate: { body: z.strictObject({ device_id: z.string(), token: z.string() }) },
      handler: async ({ body: { device_id, token } }) => {
        const accounts = await accountsStore.get();
        const account = accounts.find((a) => a.deviceId === device_id);
        if (!account || !isTokenValid(account.token, token)) throw unhautorized();
        await accountsStore.set((prev) => prev.filter((p) => p.deviceId !== device_id));
        return jsonResponse({ ok: true });
      },
    }),
  }),
});
