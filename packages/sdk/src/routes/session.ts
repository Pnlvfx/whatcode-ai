import { Elysia } from 'elysia';
import * as z from 'zod/v4/mini';
import { getSessionSummaries, getUnreadSessionCount } from '../opencode/db.ts';

// TOD pagination and remove the 100 limit

export const sessionRouter = new Elysia({ prefix: '/api/session' })
  .post(
    '/summary',
    ({ body: { sessionIds }, status }) => {
      if (sessionIds.length === 0) return {};
      if (sessionIds.length > 100) return status(400, { message: 'Too many session IDs (max 100)' });
      const summaries = getSessionSummaries(sessionIds);
      return Object.fromEntries(summaries);
    },
    { body: z.strictObject({ sessionIds: z.array(z.string()) }) },
  )
  .get('/unread-count', () => ({ count: getUnreadSessionCount() }));
