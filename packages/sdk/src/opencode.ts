import { consoleColor } from '@goatjs/node/console-color';
import { createOpencodeServer } from '@opencode-ai/sdk/v2';

const HEALTH_URL = 'http://localhost:4096/global/health';

export const opencode = async () => {
  const running = await isOpencodeRunning();

  if (running) {
    consoleColor('green', '[opencode] already running');
  } else {
    consoleColor('yellow', '[opencode] starting...');
    await createOpencodeServer({ hostname: '0.0.0.0' });
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
