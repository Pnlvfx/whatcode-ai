import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { isErrorWithCode } from '../compiled/core/errors/code.ts';
import { parseError } from '../compiled/core/error.ts';
import { machineId, WHATCODE_AUTH } from '../config/constants.ts';
import fs from 'node:fs/promises';
import path from 'node:path';

// Returns the password the daemon must use: the provided one, the persisted one, or a newly generated one.
// The result is always persisted so `whatcode pair` can read it even when it came from the environment.
export const resolvePassword = async (provided: string | undefined) => {
  if (provided !== undefined) return savePassword(provided);

  const stored = await getPassword();
  if (stored.error) return fail(stored.error);
  return stored.data === undefined ? savePassword(randomBytes(PASSWORD_BYTES).toString('base64url')) : ok(stored.data);
};

export const getPassword = async () => {
  const file = await readPasswordFile();
  if (file.error) return fail(file.error);
  return file.data === undefined ? ok(undefined) : decryptPassword(file.data);
};

export const clearPassword = async () => {
  try {
    await fs.rm(PASSWORD_FILE, { force: true });
    return ok(true);
  } catch (err) {
    return fail(fsError(err));
  }
};

const PASSWORD_FILE = path.join(WHATCODE_AUTH, 'password');
const PASSWORD_BYTES = 32;
const KEY_SALT = 'whatcode-password-v1';
const CIPHER = 'aes-256-gcm';
const IV_BYTES = 12;
const FILE_MODE = 0o600;

const ok = <T>(data: T) => ({ data, error: undefined });

const fail = <E>(error: E) => ({ data: undefined, error });

const savePassword = async (password: string) => {
  try {
    // the directory must exist before the file can be written
    // eslint-disable-next-line parallelize/no-sequential-await
    await fs.mkdir(WHATCODE_AUTH, { recursive: true });
    await fs.writeFile(PASSWORD_FILE, encryptPassword(password), { mode: FILE_MODE });
    return ok(password);
  } catch (err) {
    return fail(fsError(err));
  }
};

const readPasswordFile = async () => {
  try {
    return ok(await fs.readFile(PASSWORD_FILE, 'utf8'));
  } catch (err) {
    return isErrorWithCode(err) && err.code === 'ENOENT' ? ok(undefined) : fail(fsError(err));
  }
};

// The key is bound to this machine, so a copied file can't be decrypted elsewhere. This is obfuscation, the file mode is the real protection.
const deriveKey = () => scryptSync(machineId, KEY_SALT, PASSWORD_BYTES);

const encryptPassword = (password: string) => {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(CIPHER, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
};

const decryptPassword = (payload: string) => {
  const [iv, tag, encrypted, ...rest] = payload.trim().split('.');
  if (iv === undefined || tag === undefined || encrypted === undefined || rest.length > 0) return decryptError('invalid format');

  try {
    const decipher = createDecipheriv(CIPHER, deriveKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]);
    return ok(decrypted.toString('utf8'));
  } catch (err) {
    return decryptError(parseError(err).message);
  }
};

const decryptError = (reason: string) =>
  fail({ type: 'decrypt' as const, message: `Unable to read the stored password (${reason}), run "whatcode reset" to generate a new one` });

const fsError = (err: unknown) => ({ type: 'fs' as const, message: parseError(err).message });
