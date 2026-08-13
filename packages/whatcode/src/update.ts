import { WHATCODE_ROOT } from '@whatcode-ai/sdk/internals/config/constants';
import { createStore2 } from '@whatcode-ai/sdk/internals/compiled/store/store2';
import { logger } from '@whatcode-ai/sdk/internals/logger';
import { parseError } from '@whatcode-ai/sdk/internals/compiled/core/error';
import semver from 'semver';
import * as z from 'zod/v4/mini';
import pkgJson from '../package.json' with { type: 'json' };

const INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 800;
const cacheSchema = z.strictObject({ latest: z.string(), checkedAt: z.number() });
const npmResponseSchema = z.strictObject({ version: z.string() });
const store = createStore2('update-check', cacheSchema, { directory: WHATCODE_ROOT });

export const checkForUpdate = async (currentVersion: string): Promise<void> => {
  const latest = await getLatestVersion();
  if (!latest) return;
  if (!semver.gt(latest, currentVersion)) return;
  logger.warn('whatcode', `update available: v${currentVersion} -> v${latest} — run \`npm i -g ${pkgJson.name}@latest\` to update`);
};

const getLatestVersion = async (): Promise<string | undefined> => {
  const cachedData = await store.get();
  if (cachedData.error) {
    await store.clear();
    cachedData.data = undefined;
  }
  const now = Date.now();
  if (cachedData.data && now - cachedData.data.checkedAt < INTERVAL_MS) return cachedData.data.latest;
  const { error, data } = await fetchLatestVersion();
  if (error) return cachedData.data?.latest;
  await store.set({ latest: data.version, checkedAt: now });
  return data.version;
};

const fetchLatestVersion = async () => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);
    const res = await fetch(`https://registry.npmjs.org/${pkgJson.name}/latest`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { error: { type: 'fetch', status: res.status, message: await res.text() } };
    const data = await npmResponseSchema.parseAsync(await res.json());
    return { data };
  } catch (err) {
    return { error: { type: 'unknown', message: parseError(err).message } };
  }
};
