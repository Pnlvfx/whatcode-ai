import { sValidator } from '@hono/standard-validator';
import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import * as z from 'zod/v4/mini';
import { getSessionSummaries, getUnreadSessionCount } from '../opencode/db.ts';
import { addScheduledPrompt, findScheduledPrompt, listSessionScheduledPrompts, removeScheduledPrompt } from '../stores/scheduled-prompts.ts';
import { scheduleBody } from '../types/schedule.ts';
import { invalidRequest } from '../validation.ts';

// TOD pagination and remove the 100 limit

export const sessionRouter = new Hono()
  .basePath('/api/session')
  .post('/summary', sValidator('json', z.strictObject({ sessionIds: z.array(z.string()) }), invalidRequest), (c) => {
    const { sessionIds } = c.req.valid('json');
    if (sessionIds.length > 100) return c.json({ message: 'Too many session IDs (max 100)' }, 400);
    const { data, error } = getSessionSummaries(sessionIds);
    return error ? c.json({ message: error.message }, 500) : c.json(Object.fromEntries(data), 200);
  })
  .get('/unread-count', (c) => {
    const { data, error } = getUnreadSessionCount();
    return error ? c.json({ message: error.message }, 500) : c.json({ count: data }, 200);
  })
  .post('/schedule', sValidator('json', scheduleBody, invalidRequest), async (c) => {
    const body = c.req.valid('json');
    if (body.runAt <= Date.now()) return c.json({ message: 'The scheduled time must be in the future' }, 400);
    // opencode only accepts client ids with this prefix, and the id doubles as its message id
    const { error } = await addScheduledPrompt({ id: `msg_${randomUUID()}`, status: 'pending', ...body });
    return error ? c.json({ message: error.message }, 500) : c.json({ status: 'success' });
  })
  .get('/schedule', sValidator('query', z.strictObject({ sessionId: z.string() }), invalidRequest), async (c) => {
    const { sessionId } = c.req.valid('query');
    const { data, error } = await listSessionScheduledPrompts(sessionId);
    return error ? c.json({ message: error.message }, 500) : c.json(data);
  })
  .delete('/schedule/:id', sValidator('param', z.strictObject({ id: z.string() }), invalidRequest), async (c) => {
    const { id } = c.req.valid('param');
    const found = await findScheduledPrompt(id);
    if (found.error) return c.json({ message: found.error.message }, 500);
    if (found.data === undefined) return c.json({ message: 'The scheduled prompt was already sent or cancelled' }, 404);

    const { error } = await removeScheduledPrompt(id);
    return error ? c.json({ message: error.message }, 500) : c.json({ status: 'success' });
  });
