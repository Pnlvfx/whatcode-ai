import { Elysia, status } from 'elysia';
import * as z from 'zod/v4/mini';
import { getNotificationState, markSessionSeen } from '../stores/notification-state.ts';

export const notificationRouter = new Elysia({ prefix: '/notification' })
  .get('/state', async ({ status }) => {
    const result = await getNotificationState();
    return result.error ? status(500, { message: result.error.message }) : result.data;
  })
  .post(
    '/viewed',
    async ({ body: { sessionID } }) => {
      const result = await markSessionSeen(sessionID);
      return result.error ? status(500, { message: result.error }) : { status: 'success' };
    },
    { body: z.strictObject({ sessionID: z.string() }) },
  );
