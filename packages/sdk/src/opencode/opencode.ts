import { type ServerOptions, createOpencodeClient, createOpencodeServer } from '@opencode-ai/sdk/v2';
import { logger } from '../logger.ts';

type OpencodeServerOptions = Omit<ServerOptions, 'config' | 'port'> & { port: number; password?: string };

export const createOpencode = async ({ password, port, hostname, signal, timeout }: OpencodeServerOptions) => {
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

    // eslint-disable-next-line parallelize/no-sequential-await -- health check must follow server creation to verify the server that was just started
    server = await createOpencodeServer({
      port,
      ...(hostname !== undefined && { hostname }),
      ...(signal !== undefined && { signal }),
      ...(timeout !== undefined && { timeout }),
    });
    const { data, error } = await client.global.health();
    if (error)
      return {
        error: {
          type: 'opencode' as const,
          message: 'Failed to start OpenCode, please check your ~/.local/share/opencode/ folder to check the logs',
        },
      };
    version = data.version;
    logger.info('opencode', `started OpenCode on version ${data.version}`);
  }

  return { data: { server, client, version } };
};

const getOpencodeAuthHeader = (password: string) => `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}`;
