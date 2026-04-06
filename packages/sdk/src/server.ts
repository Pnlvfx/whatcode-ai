import type { OpencodeClient } from '@opencode-ai/sdk/v2';
import { getLastMessageTimeByProject } from './db.ts';
// eslint-disable-next-line no-restricted-imports
import express, { Router, type Request, type Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { registerDeviceTokenRouter } from './routes/register-device-token.ts';
import { identityStore } from './stores/identity.ts';
import { logger } from './logger.ts';

export interface DaemonIdentity {
  machineId: string;
  opencodeUrl: string | undefined;
  daemonUrl: string | undefined;
  tailscaleUrl?: string;
}

export const startWhatcode = async ({
  port,
  opencodePort,
  client,
}: {
  port: number;
  opencodePort: number;
  client: OpencodeClient;
}): Promise<void> => {
  const app = express();
  app.disable('x-powered-by');

  app.use('/notifications', express.json(), registerDeviceTokenRouter);

  app.get('/whatcode/identity', (_req: Request, res: Response) => {
    res.json(identityStore.get());
  });

  const projectRouter = Router();

  projectRouter.get('/project', async (_req: Request, res: Response) => {
    const { data: projects } = await client.project.list<true>();
    const lastMessageTimes = getLastMessageTimeByProject();

    const patched = projects.map((project) => {
      const lastMsg = lastMessageTimes.get(project.id);
      return lastMsg === undefined ? project : { ...project, time: { ...project.time, updated: lastMsg } };
    });

    res.json(patched);
  });

  app.use(projectRouter);

  app.use(
    '/',
    createProxyMiddleware({
      target: `http://localhost:${opencodePort.toString()}`,
      changeOrigin: false,
      proxyTimeout: 0,
      timeout: 0,
      on: {
        proxyRes: (proxyRes) => {
          proxyRes.headers['cache-control'] = 'no-cache';
          proxyRes.headers['x-accel-buffering'] = 'no';
        },
      },
    }),
  );

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        logger.info('daemon', `started on port ${port.toString()}`);
        resolve();
      }
    });
    server.on('error', reject);
  });
};
