/* eslint-disable no-console */
import http from 'node:http';
import { registerDeviceTokenRoute } from './routes/register-device-token.ts';

export interface ProxyRoute {
  method: string;
  path: string;
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void | Promise<void>;
}

export interface ProxyConfig {
  opencodePort: number;
  proxyPort: number;
}

export const startProxy = (config: ProxyConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const routes = [registerDeviceTokenRoute];
      const customRoute = routes.find((r) => r.method === req.method && r.path === req.url);

      if (customRoute) {
        Promise.resolve(customRoute.handler(req, res)).catch((err: unknown) => {
          console.error('[proxy] custom route error:', err);
          res.writeHead(500);
          res.end('Internal Server Error');
        });
        return;
      }

      forwardToOpencode(req, res, config.opencodePort);
    });

    server.on('error', reject);

    server.listen(config.proxyPort, () => {
      console.log(`[proxy] started on port ${config.proxyPort.toString()}`);
      resolve();
    });
  });
};

const forwardToOpencode = (req: http.IncomingMessage, res: http.ServerResponse, opencodePort: number): void => {
  const options: http.RequestOptions = {
    hostname: 'localhost',
    port: opencodePort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error('[proxy] upstream error:', err);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxy, { end: true });
};
