// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import { apnTokenStore } from '../stores/apn-token.ts';
import { logger } from '../logger.ts';
import * as z from 'zod';

const unregisterBodySchema = z.strictObject({ user_id: z.string(), device_id: z.string() });
const registerBodySchema = z.strictObject({ ...unregisterBodySchema.shape, token: z.string(), device_name: z.string() });

const router = Router();

router.post('/register', async (req, res) => {
  const result = await registerBodySchema.safeParseAsync(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'token is required' });
    return;
  }

  logger.debug('apn', `token received for device ${result.data.device_id}`);

  await apnTokenStore.set((prev) => [
    ...prev.filter((e) => e.deviceId !== result.data.device_id),
    { userId: result.data.user_id, deviceId: result.data.device_id, token: result.data.token, deviceName: result.data.device_name },
  ]);

  logger.debug('apn', `token stored for device ${result.data.device_id} (user ${result.data.user_id})`);

  res.status(200).json({ ok: true });
});

router.delete('/unregister', async (req, res) => {
  const result = unregisterBodySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'device_id is required' });
    return;
  }

  logger.debug('apn', `token unregistered for device ${result.data.device_id}`);

  await apnTokenStore.set((prev) => prev.filter((e) => e.deviceId !== result.data.device_id));
  res.status(200).json({ ok: true });
});

export { router as registerDeviceTokenRouter };

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type UnregisterBody = z.infer<typeof unregisterBodySchema>;
