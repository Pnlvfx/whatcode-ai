import * as z from 'zod/v4/mini';
import { fetchError } from '../../sdk/src/compiled/core/errors/fetch.ts';

const registrySchema = z.strictObject({ version: z.string() });

export const getLatestPkgVersion = async (pkgName: string) => {
  const url = `https://registry.npmjs.org/${pkgName}/latest`;
  const res = await fetch(url);
  if (!res.ok) throw fetchError(res.statusText, { status: res.status, url });
  return registrySchema.parse(await res.json()).version;
};
