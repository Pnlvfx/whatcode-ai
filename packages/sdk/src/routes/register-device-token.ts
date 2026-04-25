// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import * as z from 'zod';
import { apnTokenStore } from '../stores/apn-token.ts';
import { logger } from '../logger.ts';

const unregisterBodySchema = z.strictObject({ user_id: z.string(), device_id: z.string() });
const tokenBodySchema = z.strictObject({ ...unregisterBodySchema.shape, token: z.string(), device_name: z.string() });

export const registerDeviceTokenRouter = Router();

registerDeviceTokenRouter.post('/register', async (req, res) => {
  const result = await tokenBodySchema.safeParseAsync(req.body);

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

  logger.debug('apn', `token received for device ${result.data.device_id}`);

  await apnTokenStore.set((prev) => [
    ...prev.filter((e) => e.deviceId !== result.data.device_id),
    { userId: result.data.user_id, deviceId: result.data.device_id, token: result.data.token, deviceName: result.data.device_name },
  ]);

  logger.debug('apn', `token stored for device ${result.data.device_id} (user ${result.data.user_id})`);

  res.status(200).json({ ok: true });
});

registerDeviceTokenRouter.delete('/unregister', async (req, res) => {
  const result = unregisterBodySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'device_id is required' });
    return;
  }

  logger.debug('apn', `token unregistered for device ${result.data.device_id}`);

  const entries = await apnTokenStore.get();
  await apnTokenStore.set(entries.filter((e) => e.deviceId !== result.data.device_id));
  res.status(200).json({ ok: true });
});
