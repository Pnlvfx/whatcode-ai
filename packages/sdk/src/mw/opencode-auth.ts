import { Elysia } from 'elysia';
import { timingSafeEqual } from 'node:crypto';

const unauthorized = () => new Response('Unauthorized', { status: 401 });

export const opencodeBasicAuth = (password: string) =>
  new Elysia({ name: 'opencode-basic-auth' }).onBeforeHandle(({ headers }): Response | undefined => {
    const authorization = headers['authorization'];
    if (!authorization?.startsWith('Basic ')) return unauthorized();
    const encoded = authorization.slice('Basic '.length);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const colonIndex = decoded.indexOf(':');
    const pass = colonIndex === -1 ? decoded : decoded.slice(colonIndex + 1);
    const passOk = pass.length === password.length && timingSafeEqual(Buffer.from(pass), Buffer.from(password));
    return passOk ? undefined : unauthorized();
  });
