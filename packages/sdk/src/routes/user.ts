import { createRouter, jsonResponse } from '@coraline/server';
import { identityStore } from '../stores/identity.ts';
import * as z from 'zod/v4/mini';
import { accountsStore } from '../stores/accounts.ts';
import { createHash } from 'node:crypto';

export const userRouter = createRouter({
  handlers: (define) => ({
    pair: define({
      path: '/pair',
      method: 'post',
      validate: { body: z.strictObject({ user_id: z.string(), device_id: z.string(), device_name: z.string() }) },
      handler: async ({ body: { device_id, device_name, user_id } }) => {
        await accountsStore.set((prev) => [
          ...prev.filter((p) => p.deviceId !== device_id),
          { deviceId: device_id, deviceName: device_name, userId: user_id },
        ]);

        const userToken = createHash().update([]);

        return jsonResponse({ token });
      },
    }),
    // TODO use a token
    getUser: define({
      path: '/',
      method: 'get',
      handler: async ({ userId }) => {
        const { name, daemon, machineId, opencode, tailscale } = identityStore.get();
        return {};
      },
    }),
    updateUser: define({
      path: '/update',
      method: 'post',
      handler: async () => {},
    }),
    logout: define({
      path: '/logout',
      method: 'post',
      handler: async () => {},
    }),
  }),
});
