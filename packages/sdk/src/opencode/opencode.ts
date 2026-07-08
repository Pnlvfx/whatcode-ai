import { type ServerOptions, createOpencodeClient, createOpencodeServer } from '@opencode-ai/sdk/v2';
import { lt } from 'semver';
import { OPENCODE_MIN_VERSION } from '../config/constants.ts';
import { logger } from '../compiled/node/logger.ts';

type OpencodeServerOptions = Omit<ServerOptions, 'config' | 'port'> & { port: number; password?: string };

export const opencode = async ({ password, port, hostname, signal, timeout }: OpencodeServerOptions) => {
  const opencodeAuthHeader = password ? getOpencodeAuthHeader(password) : undefined;

  const client = createOpencodeClient({
    baseUrl: `http://localhost:${port.toString()}`,
    ...(opencodeAuthHeader && { headers: { authorization: opencodeAuthHeader } }),
  });

  const { data } = await client.global.health();
  let server;
  let version: string | undefined;

  if (data?.healthy) {
    version = data.version;
    logger.debug('opencode', `already running on ${data.version}`);
  } else {
    if (password) {
      // eslint-disable-next-line no-restricted-properties
      process.env['OPENCODE_SERVER_PASSWORD'] = password;
    }

    server = await createOpencodeServer({
      port,
      ...(hostname !== undefined && { hostname }),
      ...(signal !== undefined && { signal }),
      ...(timeout !== undefined && { timeout }),
    });
    const { data, error } = await client.global.health();
    if (error) throw new Error('Failed to start OpenCode, please check your ~/.local/share/opencode/ folder to check the logs', { cause: error });
    version = data.version;
    logger.debug('opencode', `started on version ${data.version}`);
  }

  return { server, client, version };
};

export const checkOpencodeMinVersion = (version: string) => {
  if (lt(version, OPENCODE_MIN_VERSION)) {
    logger.warn('opencode', `version ${version} is below minimum required version ${OPENCODE_MIN_VERSION}`);
  }
};

const getOpencodeAuthHeader = (password: string) => `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}`;
