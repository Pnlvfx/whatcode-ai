import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import net from 'node:net';
import tls from 'node:tls';
import { parseError } from './compiled/core/error.ts';
import { toNumber } from './compiled/core/number.ts';
import { logger } from './logger.ts';

interface UpgradeParams {
  req: IncomingMessage;
  socket: Duplex;
  head: Buffer;
  target: URL;
}

const PTY_PREFIX = '/api/pty/';
const CONNECT_SUFFIX = '/connect';
const HANDSHAKE_HEADERS = ['connection', 'upgrade', 'sec-websocket-key', 'sec-websocket-version', 'sec-websocket-protocol', 'sec-websocket-extensions'];

// Pipes PTY websocket upgrades straight to OpenCode as raw sockets, so terminal frames are never parsed here.
// The daemon has no websocket routes of its own, so any other upgrade is dropped.
export const attachPtyUpgradeProxy = (server: Server, opencodeUrl: string) => {
  const target = new URL(opencodeUrl);
  server.on('upgrade', (req, socket, head) => {
    if (isPtyUpgrade(req)) {
      proxyUpgrade({ req, socket, head, target });
      return;
    }
    socket.destroy();
  });
};

// The ticket is validated by OpenCode on the upstream leg, the daemon only recognizes the route.
const isPtyUpgrade = ({ url = '/', headers }: IncomingMessage) => {
  if (headers.upgrade?.toLowerCase() !== 'websocket') return false;
  const { pathname, searchParams } = new URL(url, 'http://localhost');
  return isPtyConnectPath(pathname) && Boolean(searchParams.get('ticket'));
};

const isPtyConnectPath = (pathname: string) => {
  if (!pathname.startsWith(PTY_PREFIX) || !pathname.endsWith(CONNECT_SUFFIX)) return false;
  const ptyId = pathname.slice(PTY_PREFIX.length, -CONNECT_SUFFIX.length);
  return ptyId.length > 0 && !ptyId.includes('/');
};

const proxyUpgrade = ({ req, socket, head, target }: UpgradeParams) => {
  const upstream = openUpstream(target);
  upstream.setNoDelay(true);
  upstream.write(serializeHandshake(req, target.host));
  if (head.length > 0) upstream.write(head);
  socket.pipe(upstream);
  upstream.pipe(socket);
  closeTogether(socket, upstream, 'client');
  closeTogether(upstream, socket, 'upstream');
};

const openUpstream = (target: URL) => {
  const { protocol, hostname } = target;
  const port = resolvePort(target);
  return protocol === 'https:' ? tls.connect({ host: hostname, port, servername: hostname }) : net.connect({ host: hostname, port });
};

// URL drops default ports, so an empty port means 443 for https and 80 for http.
const resolvePort = ({ protocol, port }: URL) => {
  if (port !== '') return toNumber(port);
  return protocol === 'https:' ? 443 : 80;
};

// Only the websocket handshake headers are forwarded, so the daemon's own credentials never reach OpenCode.
const serializeHandshake = ({ method = 'GET', url = '/', headers }: IncomingMessage, host: string) => {
  const lines = [`${method} ${url} HTTP/1.1`, `host: ${host}`];
  for (const name of HANDSHAKE_HEADERS) {
    const value = headers[name];
    if (value !== undefined) lines.push(`${name}: ${Array.isArray(value) ? value.join(', ') : value}`);
  }
  return `${lines.join('\r\n')}\r\n\r\n`;
};

const closeTogether = (source: Duplex, peer: Duplex, label: string) => {
  source.on('error', (error) => {
    logger.error('pty-proxy', `${label} socket failed: ${parseError(error).message}`, error);
    peer.destroy();
  });
  source.on('close', () => {
    peer.destroy();
  });
};
