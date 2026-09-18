import { Elysia, status } from 'elysia';
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
      const accountsResult = await getAccounts();
      if (accountsResult.error) return status(500, { message: accountsResult.error.message });
      const accounts = accountsResult.data;
      let account = accounts.find((a) => a.deviceId === device_id);
      const identityData = await getIdentity();
      if (identityData.error) return status(400, { message: identityData.error.message });
      if (!account) {
        account = {
          name: identityData.data.name,
          token: randomBytes(32).toString('hex'),
          id: randomUUID(),
          deviceId: device_id,
          deviceName: device_name,
        };
        const { error } = await addAccount(account);
        if (error) return status(500, { message: error.message });
      }
      return { token: account.token, user: buildAccountResponse(account, identityData.data) };
    },
    { body: pairUserBody },
  )
  .use(userAuth)
  .get('/', async ({ account }) => {
    const identityData = await getIdentity();
    return identityData.error ? status(400, { message: identityData.error.message }) : { user: buildAccountResponse(account, identityData.data) };
  })
  .post(
    '/apn-token',
    async ({ body: { token }, account }) => {
      const { error } = await updateAccountApnToken({ deviceId: account.deviceId, apnToken: token });
      return error ? status(400, { message: error.message }) : { status: 'success' };
    },
    { body: z.strictObject({ token: z.string() }) },
  )
  .post('/logout', async ({ account }) => {
    const { error } = await deleteAccountApnToken({ deviceId: account.deviceId });
    return error ? status(400, { message: error.message }) : { status: 'success' };
  });
