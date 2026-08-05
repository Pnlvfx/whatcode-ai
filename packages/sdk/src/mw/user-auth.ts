import { Elysia } from 'elysia';
import { timingSafeEqual } from 'node:crypto';
import { getAccounts } from '../stores/accounts.ts';
import { status } from 'elysia/error';

export const userAuth = new Elysia({ name: 'user-auth' }).derive({ as: 'scoped' }, async ({ headers }) => {
  const authorization = headers['x-whatcode-auth'];
  if (!authorization?.startsWith('Bearer ')) return status(401, { message: 'Unauthorized' });
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) return status(401, { message: 'Unauthorized' });
  const accounts = await getAccounts();
  const account = accounts.find((a) => a.token.length === token.length && timingSafeEqual(Buffer.from(a.token), Buffer.from(token)));
  if (!account) return status(401, { message: 'Unauthorized' });
  return { account };
});
