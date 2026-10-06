import type { WhatCodeClient } from './opencode/client.ts';
import { Service, type Endpoint } from '@opencode/client/service';
import { Elysia } from 'elysia';
import { node } from '@elysiajs/node';
import { userRouter } from './routes/user.ts';
import { sessionRouter } from './routes/session.ts';
import { opencodeBasicAuth } from './mw/opencode-auth.ts';
import { fetch, Headers, Response } from 'undici';
import { logger } from './logger.ts';
import { MIN_APP_VERSION } from './config/constants.ts';
import pkgJson from '../package.json' with { type: 'json' };
import { notificationRouter } from './routes/notification.ts';
import { createProjectRouterOverride } from './routes/project.ts';

interface Params {
  port: number;
  endpoint: Endpoint;
  password: string | undefined;
  client: WhatCodeClient;
}

export const startWhatcode = ({ port, endpoint, password, client }: Params) => {
  const ocHeaders = Service.headers(endpoint);
  const projectRouter = createProjectRouterOverride(client);

  return (
    new Elysia({ adapter: node() })
      .onError(({ error, request }) => {
        const { pathname, search } = new URL(request.url);
        const url = `${pathname}${search}`;
        logger.error('server-error', `An error occured at ${url}`, error);
      })
      // TODO pass should be required
      .use(password ? opencodeBasicAuth(password) : new Elysia())
      .get('/info', { version: pkgJson.version, app: { min: MIN_APP_VERSION } })
      .use(userRouter)
      .use(notificationRouter)
      .use(sessionRouter)
      .use(projectRouter)
      .all(
        '/*',
        async ({ request, set }) => {
          const requestUrl = new URL(request.url);
          const url = new URL(`${endpoint.url}${requestUrl.pathname}${requestUrl.search}`);
          const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
          const body = hasBody ? request.body : undefined;
          const requestHeaders = new Headers(request.headers);
          requestHeaders.set('host', new URL(endpoint.url).host);
          if (ocHeaders) {
            requestHeaders.set('authorization', ocHeaders.authorization);
          }
          requestHeaders.delete('accept-encoding');
          const upstream = await fetch(url.href, { method: request.method, headers: requestHeaders, body, duplex: 'half' });
          if (!upstream.ok) {
            logger.error('opencode-error', `Upstream ${request.method} ${url.pathname}${url.search} failed with ${upstream.status.toString()}`);
          }
          const responseHeaders = new Headers(upstream.headers);
          responseHeaders.delete('content-encoding');
          responseHeaders.delete('content-length');
          responseHeaders.set('cache-control', 'no-cache');
          responseHeaders.set('x-accel-buffering', 'no');
          // Pre-populate set.headers with content-type so Elysia's stream handler
          // doesn't override it with 'text/plain' when rewriting chunked responses.
          const contentType = upstream.headers.get('content-type');
          if (contentType) set.headers['content-type'] = contentType;
          return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
        },
        { parse: 'none' },
      )
      .listen(port)
  );
};
