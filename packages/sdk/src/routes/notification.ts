import { Elysia } from 'elysia';
import * as z from 'zod/v4/mini';
import { getNotificationState, markSessionViewed, setActiveSession } from '../notification/tracker.ts';

export const notificationRouter = new Elysia({ prefix: '/notification' })
  .get('/state', async () => {
    return getNotificationState();
  })
  .post(
    '/viewed',
    async ({ body: { sessionID } }) => {
      await markSessionViewed(sessionID);
      return { status: 'success' };
    },
    { body: z.strictObject({ sessionID: z.string() }) },
  )
  .post(
    '/active-session',
    ({ body: { sessionID } }) => {
      setActiveSession(sessionID);
      return { status: 'success' };
    },
    { body: z.strictObject({ sessionID: z.optional(z.string()) }) },
  );
