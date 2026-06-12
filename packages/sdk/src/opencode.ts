import { type ServerOptions, createOpencodeClient, createOpencodeServer } from '@opencode-ai/sdk/v2';
import { logger } from './logger.ts';

export const opencode = async ({ password, ...options }: Omit<ServerOptions, 'config' | 'port'> & { port: number; password?: string }) => {
  const opencodeAuthHeader = password ? `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}` : undefined;

  const client = createOpencodeClient({
    baseUrl: `http://localhost:${options.port.toString()}`,
    throwOnError: true,
    ...(opencodeAuthHeader ? { headers: { authorization: opencodeAuthHeader } } : {}),
  });

  const { data } = await client.global.health({ throwOnError: false });

  if (data?.healthy) {
    logger.debug('opencode', 'already running');
  } else {
    if (password) {
      // eslint-disable-next-line no-restricted-properties
      process.env['OPENCODE_SERVER_PASSWORD'] = password;
    }
    await createOpencodeServer(options);
    logger.debug('opencode', 'started');
  }

  return { client };
};
