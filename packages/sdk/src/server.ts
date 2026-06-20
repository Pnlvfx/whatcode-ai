import type { OpencodeClient } from '@opencode-ai/sdk/v2';
import { Elysia } from 'elysia';
import { node } from '@elysiajs/node';
import { getLastMessageTimeByProject } from './opencode/db.ts';
import { identityRouter } from './routes/deprecated/identity.ts';
import { registerDeviceTokenRouter } from './routes/deprecated/register-device.ts';
import { userRouter } from './routes/user.ts';
import { opencodeBasicAuth } from './mw/opencode-auth.ts';
import { userAuth } from './mw/user-auth.ts';
import { parseError } from './compiled/core/error.ts';
import { logger } from './compiled/node/logger.ts';
import { fetch, Headers, Response } from 'undici';
import { serverError } from './compiled/server/adapters.ts';

interface Params {
  port: number;
  opencodePort: number;
  password: string | undefined;
  client: OpencodeClient;
}

export const startWhatcode = ({ port, opencodePort, password, client }: Params) => {
  const app = new Elysia({ adapter: node() })
    .onError(({ error: err }) => {
      logger.error('server-error', parseError(err).message, err);
    })
    .use(password ? opencodeBasicAuth(password) : new Elysia())
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    .use(identityRouter)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    .use(registerDeviceTokenRouter)
    .use(userRouter)
    .use(userAuth)
    .get('/project', async () => {
      const { data: projects, error } = await client.project.list();
      if (error) throw serverError(error.data.message, { status: 400 });
      const lastMessageTimes = getLastMessageTimeByProject();
      return projects.map((project) => {
        const lastMsg = lastMessageTimes.get(project.id);
        return lastMsg === undefined ? project : { ...project, time: { ...project.time, updated: lastMsg } };
      });
    })
    .all(
      '/*',
      async ({ request }) => {
        const requestUrl = new URL(request.url);
        const url = new URL(`http://localhost:${opencodePort.toString()}${requestUrl.pathname}${requestUrl.search}`);
        const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
        const body = hasBody ? request.body : undefined;
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('host', `localhost:${opencodePort.toString()}`);
        requestHeaders.delete('accept-encoding');
        const upstream = await fetch(url.href, { method: request.method, headers: requestHeaders, body, duplex: 'half' });
        const responseHeaders = new Headers(upstream.headers);
        responseHeaders.delete('content-encoding');
        responseHeaders.delete('content-length');
        responseHeaders.set('cache-control', 'no-cache');
        responseHeaders.set('x-accel-buffering', 'no');
        return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
      },
      { parse: 'none' },
    )
    .listen(port);

  return app;
};
