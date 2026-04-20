import type * as z from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface StoreParams<T extends z.ZodType> {
  directory: string;
  initial?: z.infer<T>;
}

export interface StoreResult<T extends z.ZodType, TParams extends StoreParams<T>> {
  get: TParams['initial'] extends z.infer<T> ? () => Promise<z.infer<T>> : () => Promise<z.infer<T> | undefined>;
  set: (
    value: z.infer<T> | ((prev: TParams['initial'] extends z.infer<T> ? z.infer<T> : z.infer<T> | undefined) => z.infer<T> | Promise<z.infer<T>>),
  ) => Promise<z.infer<T>>;
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
    if (currentConfig !== undefined) {
      const buf = await getBuffer();
      if (!buf) return currentConfig;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      currentConfig = JSON.parse(buf.toString()) as StoreType;
    }

    return currentConfig;
  };

  const write = async (value: StoreType) => {
    currentConfig = await schema.parseAsync(value);
    await fs.writeFile(configFile, JSON.stringify(currentConfig));
  };

  const buf = await getBuffer();
  if (buf) {
    const parsed: unknown = JSON.parse(buf.toString());
    const result = await schema.safeParseAsync(parsed);
    if (!result.success) {
      throw new Error(
        `Found corrupted store "${name}". The stored value doesn't match the current schema — this usually happens when the schema changes or the file is edited manually. Consider resetting or migrating the stored value.`,
      );
    }
  } else if (initial !== undefined) {
    await write(initial);
  }

  const isUpdater = (
    v: StoreType | ((prev: StoreType | undefined) => StoreType | Promise<StoreType>),
  ): v is (prev: StoreType | undefined) => StoreType | Promise<StoreType> => typeof v === 'function';

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return {
    get,
    set: async (value: StoreType | ((prev: StoreType | undefined) => StoreType | Promise<StoreType>)) => {
      const resolved = isUpdater(value) ? await value(currentConfig) : value;
      await write(resolved);
      return currentConfig;
    },
    clear: async () => {
      if (initial === undefined) {
        try {
          await fs.rm(configFile);
        } catch {}
        currentConfig = undefined;
      } else {
        await write(initial);
      }
    },
  } as StoreResult<T, TParams>;
};
