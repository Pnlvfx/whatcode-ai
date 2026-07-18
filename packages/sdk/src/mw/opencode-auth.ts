import { Elysia } from 'elysia';
import { timingSafeEqual } from 'node:crypto';
import { unauthorized } from '../compiled/server/errors.ts';

export const opencodeBasicAuth = (password: string) =>
  new Elysia({ name: 'opencode-basic-auth' }).onBeforeHandle(({ headers: { authorization } }) => {
    if (!authorization?.startsWith('Basic ')) throw unauthorized();
    const encoded = authorization.slice('Basic '.length);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const colonIndex = decoded.indexOf(':');
    const pass = colonIndex === -1 ? decoded : decoded.slice(colonIndex + 1);
    const passOk = pass.length === password.length && timingSafeEqual(Buffer.from(pass), Buffer.from(password));
    if (!passOk) throw unauthorized();
  });
