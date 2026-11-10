import { createMiddleware } from 'hono/factory';
import { timingSafeEqual } from 'node:crypto';

export const basicAuth = (password: string) =>
  createMiddleware((c, next) => (isAuthorized(c.req.header('authorization'), password) ? next() : Promise.resolve(c.json({ message: 'Unauthorized' }, 401))));

const isAuthorized = (authorization: string | undefined, password: string) => {
  if (!authorization?.startsWith('Basic ')) return false;
  const encoded = authorization.slice('Basic '.length);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const colonIndex = decoded.indexOf(':');
  const pass = colonIndex === -1 ? decoded : decoded.slice(colonIndex + 1);
  return pass.length === password.length && timingSafeEqual(Buffer.from(pass), Buffer.from(password));
};
