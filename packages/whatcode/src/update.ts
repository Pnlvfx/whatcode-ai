import { WHATCODE_ROOT, createStore2, parseError, logger } from '@whatcode-ai/sdk/internals';
import semver from 'semver';
import * as z from 'zod/v4/mini';
import pkgJson from '../package.json' with { type: 'json' };

const INTERVAL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 800;
const COMMAND_TIMEOUT_MS = 10_000;
const cacheSchema = z.strictObject({ latest: z.string(), checkedAt: z.number() });
// eslint-disable-next-line no-restricted-properties
const npmResponseSchema = z.object({ version: z.string() });
const store = createStore2('update-check', cacheSchema, { directory: WHATCODE_ROOT });

export const checkForUpdate = async (currentVersion: string) => {
  const { data: latest, error } = await getLatestVersion();
  if (error) {
    logger.error('version-check', error.message, error);
  } else {
    if (!semver.gt(latest.version, currentVersion)) return;
    logger.warn('whatcode', `update available: v${currentVersion} -> v${latest.version} — run \`npm i -g ${pkgJson.name}@latest\` to update`);
  }
};

export const fetchFreshVersion = () => fetchAndCache(COMMAND_TIMEOUT_MS);

const getLatestVersion = async () => {
  const cachedData = await store.get();

  if (cachedData.error) {
    await store.clear();
    cachedData.data = undefined;
  }

  const result =
    cachedData.data && Date.now() - cachedData.data.checkedAt < INTERVAL_MS
      ? { data: { version: cachedData.data.latest } }
      : await fetchAndCache(FETCH_TIMEOUT_MS);
  return result;
};

const fetchAndCache = async (timeoutMs: number) => {
  const { error, data } = await fetchLatestVersion(timeoutMs);
  if (error) return { error };
  await store.set({ latest: data.version, checkedAt: Date.now() });
  return { data: { version: data.version } };
};

const fetchLatestVersion = async (timeoutMs: number) => {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(`https://registry.npmjs.org/${pkgJson.name}/latest`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { error: { type: 'fetch' as const, status: res.status, message: await res.text() } };
    const json = (await res.json()) as unknown;
    const parsed = await npmResponseSchema.safeParseAsync(json);
    return parsed.error ? { error: { type: 'validation' as const, message: parsed.error.message, data: json } } : { data: parsed.data };
  } catch (err) {
    return { error: { type: 'unknown' as const, message: parseError(err).message } };
  }
};
