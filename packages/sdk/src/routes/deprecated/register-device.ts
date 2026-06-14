/* eslint-disable @typescript-eslint/no-deprecated */
import { Elysia } from 'elysia';
import * as z from 'zod/v4/mini';
import { apnTokenStore } from '../../stores/apn-token.ts';
import { logger } from '../../compiled/node/logger.ts';

const unregisterBodySchema = z.strictObject({ user_id: z.string(), device_id: z.string() });
const registerBodySchema = z.strictObject({
  ...unregisterBodySchema.shape,
  token: z.string(),
  device_name: z.string(),
});

/** @deprecated */
export const registerDeviceTokenRouter = new Elysia({ prefix: '/notifications' }).post('/register', async ({ body }) => {
  const result = await registerBodySchema.safeParseAsync(body);
  if (!result.success) return new Response('token is required', { status: 400 });

  logger.debug('apn', `token received for device ${result.data.device_id}`);

  await apnTokenStore.set((prev) => [
    ...prev.filter((e) => e.deviceId !== result.data.device_id),
    {
      userId: result.data.user_id,
      deviceId: result.data.device_id,
      token: result.data.token,
      deviceName: result.data.device_name,
    },
  ]);

  logger.debug('apn', `token stored for device ${result.data.device_id} (user ${result.data.user_id})`);

  return { ok: true };
});
