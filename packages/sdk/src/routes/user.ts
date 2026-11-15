import type { UserAuthEnv } from '../mw/user-auth.ts';
import { Hono } from 'hono';
import { deleteAccount } from '../stores/accounts.ts';
import { buildAccountResponse } from '../user.ts';
import { getIdentity } from '../stores/identity.ts';

export const userRouter = new Hono<UserAuthEnv>()
  .get('/', async (c) => {
    const identityData = await getIdentity();
    return identityData.error
      ? c.json({ message: identityData.error.message }, 400)
      : c.json({ user: buildAccountResponse(c.get('account'), identityData.data) }, 200);
  })
  .post('/logout', async (c) => {
    const { error } = await deleteAccount(c.get('account'));
    return error ? c.json({ message: error.message }, 400) : c.json({ status: 'success' }, 200);
  });
