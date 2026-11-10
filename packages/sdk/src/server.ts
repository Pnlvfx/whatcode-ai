import type { ServerType } from '@hono/node-server';
import type { Context } from 'hono';
import type { ApplyGlobalResponse } from 'hono/client';
import type { WhatCodeClient } from './opencode/client.ts';
import { Service, type Endpoint } from '@opencode/client/service';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { once } from 'node:events';
import { Server } from 'node:http';
import { userRouter } from './routes/user.ts';
import { sessionRouter } from './routes/session.ts';
import { basicAuth } from './mw/opencode-auth.ts';
import { logger } from './logger.ts';
import { MIN_APP_VERSION } from './config/constants.ts';
import { createProjectRouterOverride } from './routes/project.ts';
import { createGitRouter } from './routes/git.ts';
import { attachPtyUpgradeProxy } from './pty-proxy.ts';
import pkgJson from '../package.json' with { type: 'json' };

interface Params {
  port: number;
  endpoint: Endpoint;
  password: string;
  client: WhatCodeClient;
}

// the auth middleware and onError answer outside the route handlers, so hono only knows about them when they are declared here
export type DaemonApp = ApplyGlobalResponse<ReturnType<typeof createApp>, { 401: { json: { message: string } }; 500: { json: { message: string } } }>;

export const startWhatcode = async ({ client, endpoint, password, port }: Params) => {
  const server = toHttpServer(serve({ fetch: createApp({ client, password, endpoint }).fetch, port }));
  attachPtyUpgradeProxy(server, endpoint.url);
  await once(server, 'listening');
};

const toHttpServer = (server: ServerType) => {
  if (server instanceof Server) return server;
  throw new Error('Expected an HTTP/1 server from @hono/node-server');
};

const createApp = ({ endpoint, password, client }: Pick<Params, 'client' | 'endpoint' | 'password'>) => {
  return new Hono({ strict: false })
    .onError(handleError)
    .use(basicAuth(password))
    .get('/info', (c) => c.json({ version: pkgJson.version, app: { min: MIN_APP_VERSION } }, 200))
    .route('/', userRouter)
    .route('/', sessionRouter)
    .route('/', createProjectRouterOverride(client))
    .route('/', createGitRouter(client))
    .all('/*', createProxy(endpoint));
};

const handleError = (error: Error, c: Context) => {
  if (error instanceof HTTPException) return c.json({ message: error.message }, error.status);
  const { pathname, search } = new URL(c.req.url);
  logger.error('server-error', `An error occured at ${pathname}${search}`, error);
  return c.json({ message: 'Internal server error' }, 500);
};

const createProxy = (endpoint: Endpoint) => {
  const host = new URL(endpoint.url).host;
  const authorization = Service.headers(endpoint)?.authorization;
  return async ({ req: { raw } }: Context) => {
    const { pathname, search } = new URL(raw.url);
    const upstream = await fetch(`${endpoint.url}${pathname}${search}`, buildUpstreamInit(raw, host, authorization));
    if (!upstream.ok) {
      logger.error('opencode-error', `Upstream ${raw.method} ${pathname}${search} failed with ${upstream.status.toString()}`);
    }
    return new Response(upstream.body, { status: upstream.status, headers: buildResponseHeaders(upstream.headers) });
  };
};

const buildUpstreamInit = (raw: Request, host: string, authorization: string | undefined) => {
  const hasBody = raw.method !== 'GET' && raw.method !== 'HEAD';
  return {
    method: raw.method,
    headers: buildUpstreamHeaders(raw, host, authorization),
    duplex: 'half',
    ...(hasBody && raw.body && { body: raw.body }),
  } satisfies RequestInit & { duplex: 'half' };
};

const buildUpstreamHeaders = ({ headers: source }: Request, host: string, authorization: string | undefined) => {
  const headers = new Headers(source);
  headers.set('host', host);
  if (authorization === undefined) headers.delete('authorization');
  else headers.set('authorization', authorization);
  headers.delete('accept-encoding');
  return headers;
};

const buildResponseHeaders = (source: Headers) => {
  const headers = new Headers(source);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.set('cache-control', 'no-cache');
  headers.set('x-accel-buffering', 'no');
  return headers;
};
