import type * as z from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface StoreParams<T extends z.ZodType> {
  directory: string;
  initial?: z.infer<T>;
}

export interface StoreResult<T extends z.ZodType, TParams extends StoreParams<T>> {
  get: TParams['initial'] extends z.infer<T> ? () => Promise<z.infer<T>> : () => Promise<z.infer<T> | undefined>;
  set: (value: z.infer<T>) => Promise<void>;
  /** @experimental Shallow-merges the given partial into the current value. Avoid for arrays or nested objects. */
  experimental_merge: (partial: Partial<z.infer<T>>) => Promise<void>;
  clear: () => Promise<void>;
}

/** This mimic the browser localStorage and allow you to store primitives on disk. */
export const createStore = async <T extends z.ZodType, TParams extends StoreParams<T>>(
  name: string,
  schema: T,
  { directory, initial }: TParams,
): Promise<StoreResult<T, TParams>> => {
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

  const get = async () => {
    if (currentConfig === undefined) {
      const buf = await getBuffer();
      if (!buf) return currentConfig;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      currentConfig = JSON.parse(buf.toString()) as StoreType;
    }

    return currentConfig;
  };

  const set = async (value: StoreType) => {
    currentConfig = await schema.parseAsync(value);
    await fs.writeFile(configFile, JSON.stringify(currentConfig));
  };

  const buf = await getBuffer();
  if (buf) {
    const parsed: unknown = JSON.parse(buf.toString());
    const result = await schema.safeParseAsync(parsed);
    if (result.success) {
      currentConfig = result.data;
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `Found corrupted store "${name}". The stored value doesn't match the current schema — this usually happens when the schema changes or the file is edited manually. Consider resetting or migrating the stored value.`,
      );
    }
  } else if (initial !== undefined) {
    await set(initial);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return {
    get,
    set,
    experimental_merge: async (partial: Partial<StoreType>) => {
      const update = currentConfig === undefined ? partial : { ...currentConfig, ...partial };
      currentConfig = await schema.parseAsync(update);
      await fs.writeFile(configFile, JSON.stringify(currentConfig));
    },
    clear: async () => {
      try {
        await fs.rm(configFile);
      } catch {}
      currentConfig = undefined;
    },
  } as StoreResult<T, TParams>;
};
