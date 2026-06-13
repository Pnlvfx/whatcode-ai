import { createRouter, jsonResponse, unhautorized } from '@coraline/server';
import * as z from 'zod/v4/mini';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { accountsStore } from '../stores/accounts.ts';

const isTokenValid = (stored: string, incoming: string): boolean => {
  if (stored.length !== incoming.length) return false;
  return timingSafeEqual(Buffer.from(stored), Buffer.from(incoming));
};

export const userRouter = createRouter({
  handlers: (define) => ({
    pair: define({
      path: '/pair',
      method: 'post',
      validate: { body: z.strictObject({ user_id: z.string(), device_id: z.string(), device_name: z.string() }) },
      handler: async ({ body: { device_id, device_name, user_id } }) => {
        const token = randomBytes(32).toString('hex');
        await accountsStore.set((prev) => [
          ...prev.filter((p) => p.deviceId !== device_id),
          { userId: user_id, deviceId: device_id, deviceName: device_name, token },
        ]);
        return jsonResponse({ token });
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
