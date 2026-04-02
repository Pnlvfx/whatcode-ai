// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import * as z from 'zod';
import { SERVER_URL } from '../config.ts';

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
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ userId: result.data.userId, token: result.data.token }),
  });

  console.log(relayResponse.statusText, relayResponse.status);

  if (!relayResponse.ok) {
    res.status(relayResponse.status).json({ message: 'Failed to reach the relay, please retry!' });
    return;
  }

  res.status(200).json({ ok: true });
});
