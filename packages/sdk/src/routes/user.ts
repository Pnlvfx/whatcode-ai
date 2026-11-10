import { sValidator } from '@hono/standard-validator';
import { Hono } from 'hono';
import { randomBytes, randomUUID } from 'node:crypto';
import { addAccount, deleteAccount, getAccounts } from '../stores/accounts.ts';
import { userAuth, type UserAuthEnv } from '../mw/user-auth.ts';
import { pairUserBody } from '../types/user.ts';
import { buildAccountResponse } from '../user.ts';
import { getIdentity } from '../stores/identity.ts';
import { invalidRequest } from '../validation.ts';

export const userRouter = new Hono<UserAuthEnv>()
  .basePath('/user')
  .post('/pair', sValidator('json', pairUserBody, invalidRequest), async (c) => {
    const { device_id, device_name } = c.req.valid('json');
    const accountsResult = await getAccounts();
    if (accountsResult.error) return c.json({ message: accountsResult.error.message }, 500);
    const accounts = accountsResult.data;
    let account = accounts.find((a) => a.deviceId === device_id);
    const identityData = await getIdentity();
    if (identityData.error) return c.json({ message: identityData.error.message }, 500);

    if (!account) {
      account = {
        name: identityData.data.name,
        token: randomBytes(32).toString('hex'),
        id: randomUUID(),
        deviceId: device_id,
        deviceName: device_name,
      };
      const { error } = await addAccount(account);
      if (error) return c.json({ message: error.message }, 500);
    }

    return c.json({ token: account.token, user: buildAccountResponse(account, identityData.data) }, 200);
  })
  .get('/', userAuth, async (c) => {
    const identityData = await getIdentity();
    return identityData.error
      ? c.json({ message: identityData.error.message }, 400)
      : c.json({ user: buildAccountResponse(c.get('account'), identityData.data) }, 200);
  })
  .post('/logout', userAuth, async (c) => {
    const { error } = await deleteAccount(c.get('account'));
    return error ? c.json({ message: error.message }, 400) : c.json({ status: 'success' }, 200);
  });
