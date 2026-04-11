import { type ServerOptions, createOpencodeServer } from '@opencode-ai/sdk/v2';
import { logger } from './logger.ts';

export const opencode = async (options: Omit<ServerOptions, 'config' | 'port'> & { port: number }) => {
  const running = await isOpencodeRunning(options.port);

  if (running) {
    logger.info('opencode', 'already running');
  } else {
    await createOpencodeServer(options);
    logger.info('opencode', 'started');
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
