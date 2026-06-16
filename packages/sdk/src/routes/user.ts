import { Elysia } from 'elysia';
import { randomBytes, randomUUID } from 'node:crypto';
import { accountsStore } from '../stores/accounts.ts';
import { identityStore } from '../stores/identity.ts';
import { userAuth } from '../mw/user-auth.ts';
import { pairUserBody } from '../types/user.ts';
import * as z from 'zod/v4/mini';
import { buildAccountResponse } from '../user.ts';

export const userRouter = new Elysia({ prefix: '/user' })
  .post(
    '/pair',
    async ({ body: { device_id, device_name } }) => {
      const accounts = await accountsStore.get();
      let account = accounts.find((a) => a.deviceId === device_id);
      const identity = identityStore.get();
      if (!account) {
        account = {
          name: identity.name,
          token: randomBytes(32).toString('hex'),
          id: randomUUID(),
          deviceId: device_id,
          deviceName: device_name,
        };
        await accountsStore.set([...accounts, account]);
      }
      return { token: account.token, user: buildAccountResponse(account, identity) };
    },
    { body: pairUserBody },
  )
  .use(userAuth)
  .get('/', ({ account }) => ({ user: buildAccountResponse(account, identityStore.get()) }))
  .post(
    '/apn-token',
    async ({ body: { token }, account }) => {
      await accountsStore.set((prev) => prev.map((p) => (p.deviceId === account.deviceId ? { ...p, apnToken: token } : p)));
      return { status: 'success' };
    },
    { body: z.strictObject({ token: z.string() }) },
  )
  .post('/logout', async ({ account }) => {
    await accountsStore.set((prev) => prev.filter((p) => p.deviceId !== account.deviceId));
    return { status: 'success' };
  });
