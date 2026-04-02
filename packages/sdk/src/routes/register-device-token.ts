import type { ProxyRoute } from '../proxy.ts';
import http from 'node:http';
import { SERVER_URL } from '../config.ts';

const RELAY_REGISTER_URL = `${SERVER_URL}/devices`;

export const registerDeviceTokenRoute: ProxyRoute = {
  method: 'POST',
  path: '/notifications/register',
  handler: async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    const token = await extractToken(req);
    if (token) {
      await forwardTokenToRelay(token);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'token is required' }));
    }
  },
};

const extractToken = async (req: http.IncomingMessage): Promise<string | undefined> => {
  const body = await readBody(req);
  try {
    const parsed: unknown = JSON.parse(body);
    const isValid = isTokenPayload(parsed);
    return isValid ? parsed.token : undefined;
  } catch {
    return undefined;
  }
};

const forwardTokenToRelay = async (token: string): Promise<void> => {
  await fetch(RELAY_REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceToken: token }),
  });
};

const readBody = (req: http.IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
  });

const isTokenPayload = (v: unknown): v is { token: string } =>
  typeof v === 'object' && v !== null && 'token' in v && typeof (v as Record<string, unknown>)['token'] === 'string';
