import * as z from 'zod/v4/mini';

export const portSchema = z.int().check(z.gte(1), z.lte(65_535));
