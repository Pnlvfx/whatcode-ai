import * as z from 'zod/v4/mini';

export const scheduleBody = z.strictObject({
  sessionId: z.string(),
  text: z.string().check(z.minLength(1)),
  agent: z.optional(z.string()),
  runAt: z.number(),
});
