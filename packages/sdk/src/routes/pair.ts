import { sValidator } from '@hono/standard-validator';
import { Hono } from 'hono';
import { randomBytes, randomUUID } from 'node:crypto';
import { addAccount, getAccounts } from '../stores/accounts.ts';
import { pairUserBody } from '../types/user.ts';
import { buildAccountResponse } from '../user.ts';
import { getIdentity } from '../stores/identity.ts';
import { invalidRequest } from '../validation.ts';

export const pairRouter = new Hono().post('/pair', sValidator('json', pairUserBody, invalidRequest), async (c) => {
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
});
