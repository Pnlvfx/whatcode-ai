import * as z from 'zod/v4/mini';

export const pairUserBody = z.strictObject({ device_id: z.string(), device_name: z.string() });
