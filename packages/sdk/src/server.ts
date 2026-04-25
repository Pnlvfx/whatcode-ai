import type { OpencodeClient } from '@opencode-ai/sdk/v2';
import type { ClientRequest } from 'node:http';
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

const basicAuth = (password: string) => (req: Request, res: Response, next: () => void) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="whatcode"');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const encoded = header.slice('Basic '.length);
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const colonIndex = decoded.indexOf(':');
  const pass = colonIndex === -1 ? decoded : decoded.slice(colonIndex + 1);
  if (pass !== password) {
    res.setHeader('WWW-Authenticate', 'Basic realm="whatcode"');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

export const startWhatcode = async ({
  port,
  opencodePort,
  password,
  client,
}: {
  port: number;
  opencodePort: number;
  password?: string;
  client: OpencodeClient;
}): Promise<void> => {
  const app = express();
  app.disable('x-powered-by');

  if (password) {
    app.use(basicAuth(password));
  }

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

  const opencodeAuthHeader = password ? `Basic ${Buffer.from(`opencode:${password}`).toString('base64')}` : undefined;

  app.use(
    '/',
    createProxyMiddleware({
      target: `http://localhost:${opencodePort.toString()}`,
      changeOrigin: false,
      proxyTimeout: 0,
      timeout: 0,
      on: {
        ...(opencodeAuthHeader
          ? {
              proxyReq: (proxyReq: ClientRequest) => {
                proxyReq.setHeader('authorization', opencodeAuthHeader);
              },
            }
          : {}),
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
