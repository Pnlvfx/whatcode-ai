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
    } catch (err) {
      const fsError = err instanceof Error ? err : undefined;
      if (fsError && 'code' in fsError && typeof fsError.code === 'string' && fsError.code === 'ENOENT') return;
      throw err;
    }
  };

  // validate prev stored
  const buf = await getBuffer();
  if (buf) {
    const parsed: unknown = JSON.parse(buf.toString());
    const result = await schema.safeParseAsync(parsed);
    if (!result.success) {
      throw new Error(
        `Found corrupted store "${name}". The stored value doesn't match the current schema — this usually happens when the schema changes or the file is edited manually. Consider resetting or migrating the stored value.`,
      );
    }
  }
  //

  const get = async () => {
    if (currentConfig === undefined) {
      const buf = await getBuffer();
      if (buf) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        currentConfig = JSON.parse(buf.toString()) as StoreType;
      }
    }

    return currentConfig ?? initial;
  };

  const write = async (value: StoreType) => {
    currentConfig = await schema.parseAsync(value);
    await fs.writeFile(configFile, JSON.stringify(currentConfig));
  };

  const isUpdater = (
    v: StoreType | ((prev: StoreType | undefined) => StoreType | Promise<StoreType>),
  ): v is (prev: StoreType | undefined) => StoreType | Promise<StoreType> => typeof v === 'function';

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return {
    get,
    set: async (value: StoreType | ((prev: StoreType | undefined) => StoreType | Promise<StoreType>)) => {
      let resolved;
      if (isUpdater(value)) {
        // if set is called before get, we have to call get ourself otherwise currentConfig is not set
        if (currentConfig === undefined) {
          await get();
        }
        resolved = await value(currentConfig ?? initial);
      } else {
        resolved = value;
      }
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
