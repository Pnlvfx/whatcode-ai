import type { Account } from '../stores/accounts.ts';
import { createMiddleware } from 'hono/factory';
import { timingSafeEqual } from 'node:crypto';
import { getAccounts } from '../stores/accounts.ts';

export interface UserAuthEnv {
  Variables: { account: Account };
}

export const userAuth = createMiddleware<UserAuthEnv>(async (c, next) => {
  const authorization = c.req.header('x-whatcode-auth');
  if (!authorization?.startsWith('Bearer ')) return c.json({ message: 'Unauthorized' }, 401);
  const token = authorization.slice('Bearer '.length);
  if (!token) return c.json({ message: 'Unauthorized' }, 401);
  const accountsResult = await getAccounts();
  if (accountsResult.error) return c.json({ message: accountsResult.error.message }, 500);
  const account = accountsResult.data.find((a) => a.token.length === token.length && timingSafeEqual(Buffer.from(a.token), Buffer.from(token)));
  if (!account) return c.json({ message: 'Unauthorized' }, 401);
  c.set('account', account);
  return next();
});
