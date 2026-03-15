/* eslint-disable no-console */
import { type ServerOptions, createOpencodeServer } from '@opencode-ai/sdk/v2';

const HEALTH_URL = 'http://localhost:4096/global/health';

export const opencode = async (options: Omit<ServerOptions, 'config'>) => {
  const running = await isOpencodeRunning();

  if (running) {
    console.log('[opencode] already running');
  } else {
    console.log('[opencode] starting...');
    await createOpencodeServer({ hostname: '0.0.0.0', ...options });
  }
};

const isOpencodeRunning = async (): Promise<boolean> => {
  try {
    const res = await fetch(HEALTH_URL);
    return res.ok;
  } catch {
    return false;
  }
};
