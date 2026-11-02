import { createStore2 } from '../compiled/store/store2.ts';
import { parseError } from '../compiled/core/error.ts';
import { WHATCODE_ROOT } from '../config/constants.ts';
import * as z from 'zod/v4/mini';
import path from 'node:path';

export const getGlobalConfig = async () => {
  try {
    const { data, error } = await globalConfigStore.get();
    return error ? { error: configError(error.message) } : { data };
  } catch (err) {
    return { error: configError(parseError(err).message) };
  }
};

const CONFIG_NAME = 'config';
const CONFIG_FILE = path.join(WHATCODE_ROOT, `${CONFIG_NAME}.json`);

const globalConfigSchema = z.strictObject({
  tailscale: z.optional(z.boolean()),
  tunnel: z.optional(z.boolean()),
  port: z.optional(z.int().check(z.gte(1), z.lte(65_535))),
  logLevel: z.optional(z.literal(['none', 'info', 'debug'])),
});

const globalConfigStore = createStore2(CONFIG_NAME, globalConfigSchema, { directory: WHATCODE_ROOT, initial: {} });

const configError = (message: string) => ({ type: 'config' as const, message: `Unable to load the global config (${CONFIG_FILE}): ${message}` });
