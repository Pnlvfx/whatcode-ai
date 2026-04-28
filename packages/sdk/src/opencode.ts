import { type ServerOptions, createOpencodeServer } from '@opencode-ai/sdk/v2';
import { logger } from './logger.ts';

export const opencode = async ({ password, ...options }: Omit<ServerOptions, 'config' | 'port'> & { port: number; password?: string }) => {
  const running = await isOpencodeRunning(options.port);

  if (running) {
    logger.debug('opencode', 'already running');
  } else {
    if (password) {
      // eslint-disable-next-line no-restricted-properties
      process.env['OPENCODE_SERVER_PASSWORD'] = password;
    }
    await createOpencodeServer(options);
    logger.debug('opencode', 'started');
  }
};

const isOpencodeRunning = async (port: number): Promise<boolean> => {
  try {
    const HEALTH_URL = `http://localhost:${port.toString()}/global/health`;
    const res = await fetch(HEALTH_URL);
    return res.ok;
  } catch {
    return false;
  }
};
