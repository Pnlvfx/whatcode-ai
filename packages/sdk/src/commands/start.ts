import type { LogLevel } from '../compiled/node/logger.ts';
import { parseError } from '../compiled/core/error.ts';
import { startWhatcode } from '../server.ts';
import { getLocalIp } from '../ip.ts';
import { createIdentity } from '../stores/identity.ts';
import { createTailscale } from '../plugins/tailscale/tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { isProd, SERVER_URL } from '../config/constants.ts';
import { logger } from '../logger.ts';
import { createOpencode } from '../opencode/opencode.ts';
import { isServerRunning } from '../net.ts';
import { authenticate } from '../auth/auth.ts';
import { startNotifications } from '../apn/apn.ts';
import { startEventSubscription } from '../opencode/event-subscription.ts';
import pkgJson from '../../package.json' with { type: 'json' };

export interface WhatcodeServerConfig {
  tailscale?: boolean;
  password?: string;
  port?: number;
  logLevel?: LogLevel;
}

export const createWhatcodeServer = async ({ tailscale: hasTailscale, password, port = 8192, logLevel = 'none' }: WhatcodeServerConfig = {}) => {
  logger.init({ logLevel });

  const isRunning = await isServerRunning(port);
  if (isRunning) return { error: { type: 'server' as const, message: 'The Daemon is already running on this machine!' } };

  logger.info('whatcode', `starting WhatCode${isProd ? '' : 'Dev'} on version ${pkgJson.version}...`);

  if (!isProd) {
    logger.debug('relay', `Relay url: ${SERVER_URL}`);
  }

  const [relayAuth, opencodeData, ipData] = await Promise.all([authenticate(), createOpencode(), getLocalIp()]);

  if (relayAuth.error) return { error: { type: 'relay' as const, message: relayAuth.error.value.message ?? relayAuth.error.status.toString() } };
  if (ipData.error) return { error: ipData.error };

  const { client, endpoint } = opencodeData;

  // checkOpencodeMinVersion(opencodeVersion);
  const daemonUrl = `http://${ipData.data}:${port.toString()}`;
  startEventSubscription(client);
  startNotifications(client);
  // if (flags?.WHATCODE_NOTIFICATION_V2) {
  //   startNotificationTracker(client);
  // }

  startWhatcode({ port, endpoint, password, client });
  const tailscale = hasTailscale ? createTailscale(port) : undefined;
  const tailscaleServer = tailscale ? await tailscale.start() : undefined;

  const iResult = await createIdentity({ daemon: daemonUrl, tailscale: tailscaleServer?.url });

  if (iResult.error) return { error: iResult.error };

  // clean up
  asyncExitHook(
    async () => {
      try {
        await tailscale?.stop();
      } catch (err) {
        logger.error('exit-hook', parseError(err).message, err);
      }
    },
    { wait: 3000 },
  );

  return { data: { url: tailscaleServer?.url ?? daemonUrl, version: pkgJson.version } };
};
