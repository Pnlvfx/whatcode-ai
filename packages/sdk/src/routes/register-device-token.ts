// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import * as z from 'zod';
import { apnTokenStore } from '../stores/apn-token.ts';

const tokenBodySchema = z.strictObject({ user_id: z.uuid(), device_id: z.string(), token: z.string() });

export const registerDeviceTokenRouter = Router();

registerDeviceTokenRouter.post('/register', async (req, res) => {
  const result = tokenBodySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'token is required' });
    return;
  }

  // const relayResponse = await fetch(`${SERVER_URL}/relay/register`, {
  //   method: 'POST',
  //   headers,
  //   body: JSON.stringify({ user_id: result.data.user_id, device_id: result.data.device_id, token: result.data.token }),
  // });

  // if (!relayResponse.ok) {
  //   res.status(relayResponse.status).json({ message: 'Failed to reach the relay, please retry!' });
  //   return;
  // }

  const entries = await apnTokenStore.get();
  const updated = entries.filter((e) => e.deviceId !== result.data.device_id);
  await apnTokenStore.set([...updated, { userId: result.data.user_id, deviceId: result.data.device_id, token: result.data.token }]);
  res.status(200).json({ ok: true });
});

const unregisterBodySchema = z.strictObject({ user_id: z.string(), device_id: z.string() });

registerDeviceTokenRouter.delete('/unregister', async (req, res) => {
  const result = unregisterBodySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'device_id is required' });
    return;
  }

  const entries = await apnTokenStore.get();
  await apnTokenStore.set(entries.filter((e) => e.deviceId !== result.data.device_id));
  res.status(200).json({ ok: true });
});
