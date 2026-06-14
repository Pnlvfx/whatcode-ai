import { type ServerOptions, createOpencodeClient, createOpencodeServer } from '@opencode-ai/sdk/v2';
import { logger } from '@goatjs/node/logger';
import { lt } from 'semver';
import { OPENCODE_MIN_VERSION } from './config/constants.ts';

export const opencode = async ({ password, ...options }: Omit<ServerOptions, 'config' | 'port'> & { port: number; password?: string }) => {
  const opencodeAuthHeader = password ? getOpencodeAuthHeader(password) : undefined;

  const client = createOpencodeClient({
    baseUrl: `http://localhost:${options.port.toString()}`,
    throwOnError: true,
    ...(opencodeAuthHeader ? { headers: { authorization: opencodeAuthHeader } } : {}),
  });

  const { data } = await client.global.health({ throwOnError: false });
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
    server = await createOpencodeServer(options);
    const { data } = await client.global.health<true>();
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
