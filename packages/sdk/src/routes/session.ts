import { Elysia } from 'elysia';
import { randomUUID } from 'node:crypto';
import * as z from 'zod/v4/mini';
import { getSessionSummaries, getUnreadSessionCount } from '../opencode/db.ts';
import { addScheduledPrompt, findScheduledPrompt, listSessionScheduledPrompts, removeScheduledPrompt } from '../stores/scheduled-prompts.ts';
import { scheduleBody } from '../types/schedule.ts';

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
  .get('/unread-count', () => ({ count: getUnreadSessionCount() }))
  .post(
    '/schedule',
    async ({ body, status }) => {
      if (body.runAt <= Date.now()) return status(400, { message: 'The scheduled time must be in the future' });
      // opencode only accepts client ids with this prefix, and the id doubles as its message id
      const { error } = await addScheduledPrompt({ id: `msg_${randomUUID()}`, status: 'pending', ...body });
      return error ? status(500, { message: error.message }) : { status: 'success' };
    },
    { body: scheduleBody },
  )
  .get(
    '/schedule',
    async ({ query: { sessionId }, status }) => {
      const { data, error } = await listSessionScheduledPrompts(sessionId);
      return error ? status(500, { message: error.message }) : data;
    },
    { query: z.strictObject({ sessionId: z.string() }) },
  )
  .delete(
    '/schedule/:id',
    async ({ params: { id }, status }) => {
      const found = await findScheduledPrompt(id);
      if (found.error) return status(500, { message: found.error.message });
      if (found.data === undefined) return status(404, { message: 'The scheduled prompt was already sent or cancelled' });

      const { error } = await removeScheduledPrompt(id);
      return error ? status(500, { message: error.message }) : { status: 'success' };
    },
    { params: z.strictObject({ id: z.string() }) },
  );
