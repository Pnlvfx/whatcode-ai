import { Elysia } from 'elysia';
import * as z from 'zod/v4/mini';
import { getNotificationState, markSessionSeen } from '../stores/notification-state.ts';
import { activeSessionTracker } from '../notification/active.ts';

export const notificationRouter = new Elysia({ prefix: '/notification' })
  .get('/state', async () => {
    return getNotificationState();
  })
  .post(
    '/viewed',
    async ({ body: { sessionID } }) => {
      await markSessionSeen(sessionID);
      return { status: 'success' };
    },
    { body: z.strictObject({ sessionID: z.string() }) },
  )
  .post(
    '/active-session',
    ({ body: { sessionID } }) => {
      activeSessionTracker.setActiveSession(sessionID);
      return { status: 'success' };
    },
    { body: z.strictObject({ sessionID: z.optional(z.string()) }) },
  );
