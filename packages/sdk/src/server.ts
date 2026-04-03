/* eslint-disable no-console */
import type { OpencodeClient } from '@opencode-ai/sdk/v2';
import { getLastMessageTimeByProject } from './db.ts';
// eslint-disable-next-line no-restricted-imports
import express, { Router, type Request, type Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { registerDeviceTokenRouter } from './routes/register-device-token.ts';

export const startProxy = async ({ port, opencodePort, client }: { port: number; opencodePort: number; client: OpencodeClient }): Promise<void> => {
  const app = express();
  app.disable('x-powered-by');

  app.use('/notifications', express.json(), registerDeviceTokenRouter);

  const projectRouter = Router();

  projectRouter.get('/project', async (_req: Request, res: Response) => {
    console.log('[project] fetching projects from opencode...');
    const { data: projects } = await client.project.list<true>();
    console.log(`[project] got ${projects.length.toString()} projects`);

    const lastMessageTimes = getLastMessageTimeByProject();
    console.log(`[project] got ${lastMessageTimes.size.toString()} entries from sqlite`);

    const patched = projects.map((project) => {
      const lastMsg = lastMessageTimes.get(project.id);
      return lastMsg === undefined ? project : { ...project, time: { ...project.time, updated: lastMsg } };
    });

    console.log(`[project] returning ${patched.length.toString()} projects`);

    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-cache');
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
        console.log(`[daemon] started on port ${port.toString()}`);
        resolve();
      }
    });
    server.on('error', reject);
  });
};
