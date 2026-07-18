import { Elysia } from 'elysia';
import { timingSafeEqual } from 'node:crypto';
import { accountsStore } from '../stores/accounts.ts';
import { unauthorized } from '../compiled/server/errors.ts';

export const userAuth = new Elysia({ name: 'user-auth' }).derive({ as: 'scoped' }, async ({ headers }) => {
  const authorization = headers['x-whatcode-auth'];
  if (!authorization?.startsWith('Bearer ')) throw unauthorized();
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) throw unauthorized();
  const accounts = await accountsStore.get();
  const account = accounts.find((a) => a.token.length === token.length && timingSafeEqual(Buffer.from(a.token), Buffer.from(token)));
  if (!account) throw unauthorized();
  return { account };
});
