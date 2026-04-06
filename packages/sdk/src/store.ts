/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import type * as z from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface StoreParams<T extends z.ZodType> {
  directory: string;
  initial?: z.infer<T>;
}

export interface StoreResult<T extends z.ZodType, TParams extends StoreParams<T>> {
  get: TParams['initial'] extends z.infer<T> ? () => Promise<z.infer<T>> : () => Promise<z.infer<T> | undefined>;
  set: (configs: Partial<z.infer<T>>) => Promise<void>;
  clear: () => Promise<void>;
}

/** This mimic the browser localStorage and allow you to store primitives on disk. */
export const createStore = async <T extends z.ZodType, TParams extends StoreParams<T>>(
  name: string,
  schema: T,
  params: TParams,
): Promise<StoreResult<T, TParams>> => {
  const { directory, initial } = params;
  await fs.mkdir(directory, { recursive: true });
  type StoreType = z.infer<T>;
  const configFile = path.join(directory, `${name}.json`);
  let currentConfig: StoreType | undefined;

  const getBuffer = async () => {
    try {
      return await fs.readFile(configFile);
    } catch {
      // eslint-disable-next-line unicorn/no-useless-undefined
      return undefined;
    }
  };

  const validateStored = async () => {
    const buf = await getBuffer();
    if (!buf) return;
    const result = await schema.safeParseAsync(JSON.parse(buf.toString()));
    if (!result.success) {
      // eslint-disable-next-line no-console
      console.warn(
        `Found corrupted store "${name}". The stored value does not match the current schema — this can happen if you changed the schema or manually edited the file. Please reset or update the stored value to match the expected shape.`,
      );
      return;
    }

    currentConfig = result.data;
  };

  const get = async () => {
    if (!currentConfig) {
      await validateStored();
    }

    return currentConfig;
  };

  const set = async (configs: Partial<StoreType>) => {
    const update = currentConfig ? { ...currentConfig, ...configs } : configs;
    currentConfig = await schema.parseAsync(update);
    await fs.writeFile(configFile, JSON.stringify(currentConfig));
  };

  await validateStored();

  if (initial && !currentConfig) {
    await set(initial);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return {
    get,
    set,
    clear: async () => {
      try {
        await fs.rm(configFile);
      } catch {}
      currentConfig = undefined;
    },
  } as StoreResult<T, TParams>;
};
