import { createMiddleware, unhautorized } from '@coraline/server';
import { timingSafeEqual } from 'node:crypto';

export const opencodeBasicAuth = (password: string) => {
  return createMiddleware(({ headers }) => {
    const authorization = headers.authorization;
    console.log(authorization);
    if (!authorization?.startsWith('Basic ')) throw unhautorized();
    const encoded = authorization.slice('Basic '.length);
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const colonIndex = decoded.indexOf(':');
    const pass = colonIndex === -1 ? decoded : decoded.slice(colonIndex + 1);
    const passOk = pass.length === password.length && timingSafeEqual(Buffer.from(pass), Buffer.from(password));
    if (!passOk) throw unhautorized();
  });
};
