import { createMiddleware, unhautorized } from '@coraline/server';
import { timingSafeEqual } from 'node:crypto';
import { accountsStore } from '../stores/accounts.ts';

export const userAuth = createMiddleware(async ({ headers }) => {
  const raw = headers['x-whatcode-auth'];
  const token = (Array.isArray(raw) ? raw[0] : raw)?.slice(7);
  if (!token) throw unhautorized();
  const accounts = await accountsStore.get();
  const account = accounts.find((a) => a.token.length === token.length && timingSafeEqual(Buffer.from(a.token), Buffer.from(token)));
  if (!account) throw unhautorized();
  return { account };
});
