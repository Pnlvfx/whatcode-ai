import type { OpenTunnelClientEvent, OpenTunnelConnection } from '@opentunnel/client';
import { create, ROOT_ROUTE } from '@opentunnel/client';
import { logger } from '../../logger.ts';

export const createTunnel = (port: number) => {
  const client = create();
  let connection: OpenTunnelConnection | undefined;

  return {
    start: async (): Promise<{ url: string }> => {
      logger.debug('tunnel', `connecting profile ${PROFILE} to port ${port.toString()}`);
      connection = await client.tunnel.connect({
        profile: PROFILE,
        routes: { [ROOT_ROUTE]: `127.0.0.1:${port.toString()}` },
        onRouteConflict: 'fail',
        onEvent: logEvent,
      });
      const url = connection.urls[ROOT_ROUTE];
      if (!url) throw new Error('[tunnel] could not determine the tunnel url');
      logger.debug('tunnel', `url: ${url}`);
      return { url };
    },
    stop: async (): Promise<void> => {
      // eslint-disable-next-line parallelize/no-sequential-await -- the connection must be closed before the client is disposed
      await connection?.close();
      await client.dispose();
      logger.debug('tunnel', 'tunnel closed');
    },
  };
};

const PROFILE = 'whatcode';

const logEvent = (event: OpenTunnelClientEvent) => {
  switch (event.type) {
    case 'connected': {
      logger.debug('tunnel', `connected (routes: ${event.routes.join(', ')})`);
      break;
    }
    case 'disconnected': {
      logger.debug('tunnel', `disconnected: ${event.reason}`);
      break;
    }
    case 'reconnecting': {
      logger.debug('tunnel', `reconnecting (attempt ${event.attempt.toString()}) in ${event.delayMs.toString()}ms`);
      break;
    }
    case 'route-conflict': {
      logger.warn('tunnel', `another client already serves one of the routes: ${event.routes.join(', ')}`);
      break;
    }
    case 'stopped': {
      if (event.error) logger.error('tunnel', `stopped: ${event.error}`);
      break;
    }
    default: {
      logger.debug('tunnel', `event: ${event.type}`);
    }
  }
};
