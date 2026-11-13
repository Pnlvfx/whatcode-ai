import { Service, type Endpoint } from '@opencode/client/service';
import { execa } from 'execa';
import { createWhatCodeClient } from './client.ts';
import { parseError } from '../cli/utilities.ts';
import { platform } from '../config/constants.ts';
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
  if (platform !== 'win32' || !endpoint.error) return endpoint;
  logger.warn('opencode', `Default opencode lookup failed, falling back to the installed binary: ${parseError(endpoint.error).message}`);
  const fallback = await ensureInstalledService();
  return fallback.error
    ? { error: new Error(`${parseError(endpoint.error).message}\nInstalled binary fallback: ${parseError(fallback.error).message}`) }
    : fallback;
};

// Windows cannot spawn a bare "opencode" on a cold boot, so spawn the absolute path of the installed opencode.exe like OpenCode does.
const ensureInstalledService = async () => {
  const binary = await safeTryCatch<string, Error>(findInstalledBinary());
  return binary.error ? binary : safeTryCatch<Endpoint, Error>(Service.ensure({ command: [binary.data, 'serve', '--service'] }));
};

const findInstalledBinary = async () => {
  const result = await execa('where', ['opencode'], { reject: false });
  if (result.failed) throw new Error('opencode was not found on PATH, make sure it is installed');
  const binary = result.stdout
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.toLowerCase().endsWith('.exe'));
  if (!binary) {
    throw new Error('opencode was found on PATH but not as an opencode.exe (npm .cmd shims cannot be spawned directly), install it with scoop, choco or from https://opencode.ai');
  }
  return binary;
};
