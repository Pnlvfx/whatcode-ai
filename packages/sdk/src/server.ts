import type { OpencodeClient } from '@opencode-ai/sdk/v2';
import type { ClientRequest } from 'node:http';
import { createApp, json } from '@coraline/server';
import { getLastMessageTimeByProject } from './db.ts';
import { getOpencodeAuthHeader } from './opencode.ts';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { parseError } from '@goatjs/core/error';
import { identityRouter } from './routes/deprecated/identity.ts';
import { registerDeviceTokenRouter } from './routes/deprecated/register-device.ts';
// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import { logger } from '@goatjs/node/logger';
import { NODE_ENV } from './config/constants.ts';
import { userRouter } from './routes/user.ts';
import { opencodeBasicAuth } from './mw/opencode-auth.ts';

interface Params {
  port: number;
  opencodePort: number;
  password: string | undefined;
  client: OpencodeClient;
}

export const startWhatcode = async ({ port, opencodePort, password, client }: Params) => {
  // project is a an opencode endpoint and is being readed from the opencode client,
  // our server add an extra data wrapper that break it, using plain express until we patch it
  //   const projectRouter = createRouter({
  //     handlers: (define) => ({
  //       project: define({
  //         method: 'get',
  //         path: '/',
  //         handler: async () => {
  //           const { data: projects } = await client.project.list<true>();
  //           const lastMessageTimes = getLastMessageTimeByProject();

  //           const patched = projects.map((project) => {
  //             const lastMsg = lastMessageTimes.get(project.id);
  //             return lastMsg === undefined ? project : { ...project, time: { ...project.time, updated: lastMsg } };
  //           });

  //           return jsonResponse(patched);
  //         },
  //       }),
  //     }),
  //   });

  const opencodeAuthHeader = password ? getOpencodeAuthHeader(password) : undefined;

  const jsonBody = json();

  const app = await createApp({
    port,
    middlewares: password ? [opencodeBasicAuth(password)] : [],
    routes: {
      '/user': userRouter,
    },
    expressHandlers: (express) => {
      const projectRouter = Router();

      projectRouter.get('/', async (_req, res) => {
        const { data: projects } = await client.project.list<true>();
        const lastMessageTimes = getLastMessageTimeByProject();

        const patched = projects.map((project) => {
          const lastMsg = lastMessageTimes.get(project.id);
          return lastMsg === undefined ? project : { ...project, time: { ...project.time, updated: lastMsg } };
        });

        res.status(200).json(patched);
      });

      express.use('/project', projectRouter);

      // both deprecated
      express.use('/notifications', jsonBody.handler, registerDeviceTokenRouter);
      express.use('/whatcode/identity', jsonBody.handler, identityRouter);

      express.use(
        '/',
        createProxyMiddleware({
          target: `http://localhost:${opencodePort.toString()}`,
          changeOrigin: false,
          agent: false,
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
    },
    onError: ({ err }) => {
      logger.error('server-error', parseError(err).message, err);
    },
  });

  if (NODE_ENV === 'development') {
    // eslint-disable-next-line unicorn/import-style
    const path = await import('node:path');
    const os = await import('node:os');
    const { setTimeout } = await import('node:timers/promises');
    await setTimeout(3000);
    const home = os.homedir();
    const desktop = path.join(home, 'Desktop');
    const iosApp = path.join(desktop, 'apps', 'whatcode');
    await app.generateApiSpec([{ cwd: iosApp, fullPath: path.join(iosApp, 'src', '__daemon') }]);
  }

  return app.__spec;
};

export type ApiSpec = Awaited<ReturnType<typeof startWhatcode>>;
