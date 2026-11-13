import { Service, type Endpoint } from '@opencode/client/service';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createWhatCodeClient } from './client.ts';
import { parseError } from '../cli/utilities.ts';
import { logger } from '../logger.ts';
import { safeTryCatch } from '../compiled/core/try-catch.ts';

export const createOpencode = async () => {
  const endpoint = await ensureService();
  return endpoint.error
    ? { error: { type: 'opencode' as const, message: `OpenCode service failed to start: ${parseError(endpoint.error).message}` } }
    : { data: { client: createWhatCodeClient(endpoint.data), endpoint: endpoint.data } };
};

const ensureService = async () => {
  const endpoint = await safeTryCatch<Endpoint, Error>(Service.ensure());
  if (!endpoint.error) return endpoint;
  logger.warn('opencode', `Default opencode lookup failed, falling back to the bundled binary: ${parseError(endpoint.error).message}`);
  const fallback = await ensureBundledService();
  return fallback.error
    ? { error: new Error(`${parseError(endpoint.error).message}\nBundled binary fallback: ${parseError(fallback.error).message}`) }
    : fallback;
};

// Fallback for when the default "opencode" lookup fails, which happens on Windows on a cold boot.
const ensureBundledService = async () => {
  const binary = await safeTryCatch<string, Error>(resolveBundledBinary());
  return binary.error ? binary : safeTryCatch<Endpoint, Error>(Service.ensure({ command: [binary.data, 'serve', '--service'] }));
};

const resolveBundledBinary = async () => {
  const binary = fileURLToPath(new URL('bin/opencode.exe', import.meta.resolve('@opencode/cli/package.json')));
  await access(binary);
  return binary;
};
