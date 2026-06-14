import { Elysia } from 'elysia';
import { timingSafeEqual } from 'node:crypto';
import { accountsStore } from '../stores/accounts.ts';

class UnauthorizedError extends Error {
  override readonly name = 'UnauthorizedError';
  readonly status = 401;
  constructor() {
    super('Unauthorized');
  }
}

export const userAuth = new Elysia({ name: 'user-auth' })
  .error({ UnauthorizedError })
  .onError(({ code, error: err }): Response | undefined => {
    return code === 'UnauthorizedError' ? new Response(err.message, { status: 401 }) : undefined;
  })
  .derive({ as: 'scoped' }, async ({ headers }) => {
    const raw = headers['x-whatcode-auth'];
    const token = raw?.startsWith('Bearer ') ? raw.slice(7) : undefined;
    if (!token) throw new UnauthorizedError();
    const accounts = await accountsStore.get();
    const account = accounts.find((a) => a.token.length === token.length && timingSafeEqual(Buffer.from(a.token), Buffer.from(token)));
    if (!account) throw new UnauthorizedError();
    return { account };
  });
