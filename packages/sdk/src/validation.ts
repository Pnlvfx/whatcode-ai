import type { Context } from 'hono';

interface ValidationResult {
  success: boolean;
  error?: readonly { message: string }[];
}

export const invalidRequest = (result: ValidationResult, c: Context) =>
  result.success ? undefined : c.json({ message: result.error?.[0]?.message ?? 'Invalid request' }, 422);
