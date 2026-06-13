import { createRouter, json, jsonResponse } from '@coraline/server';
import { randomBytes, randomUUID } from 'node:crypto';
import { accountsStore } from '../stores/accounts.ts';
import { pairUserBody } from '../types/user.ts';
import { identityStore } from '../stores/identity.ts';
import { userAuth } from '../mw/user-auth.ts';
import * as z from 'zod/v4/mini';

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

          await accountsStore.set([...accounts, account]);
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
    //   middleware: [userAuth] as const,
    //   validate: { body: account },
    //   handler: async ({ account }) => {},
    // }),
    updateApnToken: define({
      path: '/apn-token',
      method: 'post',
      middleware: [userAuth] as const,
      validate: { body: z.strictObject({ token: z.string() }) },
      handler: async ({ account, body: { token } }) => {
        await accountsStore.set((prev) => prev.map((p) => (p === account.id ? { ...p, apnToken: token } : p)));

        return jsonResponse({ status: 'success' });
      },
    }),
    logout: define({
      path: '/logout',
      method: 'post',
      middleware: [userAuth] as const,
      handler: async ({ account }) => {
        await accountsStore.set((prev) => prev.filter((p) => p.deviceId !== account.deviceId));
        return jsonResponse({ ok: true });
      },
    }),
  }),
});
