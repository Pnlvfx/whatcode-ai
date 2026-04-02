// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import * as z from 'zod';
import { SERVER_URL } from '../config/config.ts';
import { setToken } from '../token-store.ts';
import { headers } from '../config/headers.ts';

const tokenBodySchema = z.strictObject({ userId: z.uuid(), token: z.string() });

export const registerDeviceTokenRouter = Router();

registerDeviceTokenRouter.post('/register', async (req, res) => {
  const result = tokenBodySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'token is required' });
    return;
  }

  const relayResponse = await fetch(`${SERVER_URL}/relay/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId: result.data.userId, token: result.data.token }),
  });

  if (!relayResponse.ok) {
    res.status(relayResponse.status).json({ message: 'Failed to reach the relay, please retry!' });
    return;
  }

  setToken(result.data.userId, result.data.token);
  res.status(200).json({ ok: true });
});
