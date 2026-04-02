/* eslint-disable no-console */
// eslint-disable-next-line no-restricted-imports
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { registerDeviceTokenRouter } from './routes/register-device-token.ts';

export const startProxy = async (config: { opencodePort: number; proxyPort: number }): Promise<void> => {
  const app = express();
  app.disable('x-powered-by');

  app.use(express.json());
  app.use('/notifications', registerDeviceTokenRouter);

  app.use(
    '/',
    createProxyMiddleware({
      target: `http://localhost:${config.opencodePort.toString()}`,
      changeOrigin: false,
    }),
  );

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.proxyPort, () => {
      console.log(`[daemon] started on port ${config.proxyPort.toString()}`);
      resolve();
    });
    server.on('error', reject);
  });
};
