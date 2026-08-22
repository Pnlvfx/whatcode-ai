import { Elysia } from 'elysia';
import { randomBytes, randomUUID } from 'node:crypto';
import { addAccount, deleteAccountApnToken, getAccounts, updateAccountApnToken } from '../stores/accounts.ts';
import { userAuth } from '../mw/user-auth.ts';
import { pairUserBody } from '../types/user.ts';
import { buildAccountResponse } from '../user.ts';
import * as z from 'zod/v4/mini';
import { getIdentity } from '../stores/identity.ts';

export const userRouter = new Elysia({ prefix: '/user' })
  .post(
    '/pair',
    async ({ body: { device_id, device_name } }) => {
      const accounts = await getAccounts();
      let account = accounts.find((a) => a.deviceId === device_id);
      const identity = await getIdentity();
      if (!account) {
        account = { name: identity.name, token: randomBytes(32).toString('hex'), id: randomUUID(), deviceId: device_id, deviceName: device_name };
        await addAccount(account);
      }
      return { token: account.token, user: buildAccountResponse(account, identity) };
    },
    { body: pairUserBody },
  )
  .use(userAuth)
  .get('/', async ({ account }) => ({ user: buildAccountResponse(account, await getIdentity()) }))
  .post(
    '/apn-token',
    async ({ body: { token }, account }) => {
      await updateAccountApnToken({ deviceId: account.deviceId, apnToken: token });
      return { status: 'success' };
    },
    { body: z.strictObject({ token: z.string() }) },
  )
  .post('/logout', async ({ account }) => {
    await deleteAccountApnToken({ deviceId: account.deviceId });
    return { status: 'success' };
  });
