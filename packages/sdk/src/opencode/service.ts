import { Service } from '@opencode/client/service';
import { execa } from 'execa';
import { createWhatCodeClient } from './client.ts';
import { parseError } from '../cli/utilities.ts';
import { platform } from '../config/constants.ts';
import { logger } from '../logger.ts';
import { safeTryCatch, type Failure, type Success } from '../compiled/core/try-catch.ts';
import fs from 'node:fs/promises';
import path from 'node:path';

interface OpencodeError {
  type: 'opencode';
  message: string;
}

export const createOpencode = async () => {
  const endpoint = await ensureService();
  return endpoint.error
    ? { error: { type: 'opencode' as const, message: `OpenCode service failed to start: ${endpoint.error.message}` } }
    : { data: { client: createWhatCodeClient(endpoint.data), endpoint: endpoint.data } };
};

const opencodeError = (message: string): Failure<OpencodeError> => ({ error: { type: 'opencode', message } });

const ensureService = async () => {
  const endpoint = await safeTryCatch(Service.ensure());
  if (!endpoint.error) return endpoint;
  const { message } = parseError(endpoint.error);
  if (platform !== 'win32') return opencodeError(message);
  logger.warn('opencode', `Default opencode lookup failed, falling back to the installed binary: ${message}`);
  const fallback = await ensureInstalledService();
  return fallback.error ? opencodeError(`${message}\nInstalled binary fallback: ${fallback.error.message}`) : fallback;
};

// Windows cannot spawn a bare "opencode" on a cold boot, so spawn the absolute path of the installed opencode.exe like OpenCode does.
const ensureInstalledService = async () => {
  const binary = await findInstalledBinary();
  if (binary.error) return binary;
  const endpoint = await safeTryCatch(Service.ensure({ command: [binary.data, 'serve', '--service'] }));
  return endpoint.error ? opencodeError(parseError(endpoint.error).message) : endpoint;
};

const LOCAL_BIN_FOLDER = path.join('node_modules', '.bin');

const findInstalledBinary = async (): Promise<Success<string> | Failure<OpencodeError>> => {
  const result = await execa('where', ['opencode'], { reject: false });
  if (result.failed) return opencodeError('opencode was not found on PATH, make sure it is installed');
  const candidates = result.stdout.split('\n').map((line) => line.trim());
  const binary = candidates.find((line) => line.toLowerCase().endsWith('.exe'));
  if (binary) return { data: binary };
  // a project shim (pnpm or npm run from a repo) lives in node_modules\.bin and does not have the global npm layout, so it is skipped
  const shim = candidates.find((line) => line.toLowerCase().endsWith('.cmd') && !path.dirname(line).toLowerCase().endsWith(LOCAL_BIN_FOLDER));
  if (!shim)
    return opencodeError(
      'opencode was found on PATH but not as an opencode.exe or a global npm opencode.cmd shim, install it with npm, scoop, choco or from https://opencode.ai',
    );
  // an npm install puts opencode.cmd in the global bin folder and the real opencode.exe in node_modules next to it, and node cannot spawn the .cmd
  const shimBinary = path.join(path.dirname(shim), 'node_modules', '@opencode', 'cli', 'bin', 'opencode.exe');
  const shimAccess = await safeTryCatch(fs.access(shimBinary));
  return shimAccess.error === undefined
    ? { data: shimBinary }
    : opencodeError(
        `opencode was found as an npm shim (${shim}) but ${shimBinary} does not exist, reinstall it with npm, scoop, choco or from https://opencode.ai`,
      );
};
