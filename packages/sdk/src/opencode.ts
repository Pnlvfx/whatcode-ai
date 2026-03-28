/* eslint-disable no-console */
import { type ServerOptions, createOpencodeServer } from '@opencode-ai/sdk/v2';
import { networkInterfaces } from 'node:os';

export const PORT = 4096;
const HEALTH_URL = `http://localhost:${PORT}/global/health`;

export const opencode = async (options: Omit<ServerOptions, 'config'>) => {
  const running = await isOpencodeRunning();

  if (running) {
    console.log('[opencode] already running');
  } else {
    console.log('[opencode] starting...');
    await createOpencodeServer({ hostname: '0.0.0.0', ...options });
    console.log('[opencode] started');
  }
};

export const getLocalUrl = (): string => {
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) return `http://${net.address}:${PORT}`;
    }
  }
  return `http://localhost:${PORT}`;
};

const isOpencodeRunning = async (): Promise<boolean> => {
  try {
    const res = await fetch(HEALTH_URL);
    return res.ok;
  } catch {
    return false;
  }
};
