import * as z from 'zod/v4/mini';

export const commitBody = z.strictObject({
  directory: z.string(),
  message: z.string().check(z.trim(), z.minLength(1)),
  filePaths: z.array(z.string().check(z.minLength(1))).check(z.minLength(1)),
});

export const directoryBody = z.strictObject({ directory: z.string() });
