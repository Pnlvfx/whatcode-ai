import { Elysia, status } from 'elysia';
import * as z from 'zod/v4/mini';
import { getNotificationState, markSessionSeen } from '../stores/notification-state.ts';

export const notificationRouter = new Elysia({ prefix: '/notification' })
  .get('/state', async ({ status }) => {
    const result = await getNotificationState();
    if (result.error) return status(500, { message: result.error.message });
    return result.data;
  })
  .post(
    '/viewed',
    async ({ body: { sessionID } }) => {
      const result = await markSessionSeen(sessionID);
      if (result.error) return status(500, { message: result.error });
      return { status: 'success' };
    },
    { body: z.strictObject({ sessionID: z.string() }) },
  );
