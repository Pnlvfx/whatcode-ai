import type { LogLevel } from '../compiled/node/logger.ts';
import { parseError } from '../compiled/core/error.ts';
import { startWhatcode } from '../server.ts';
import { getLocalIp } from '../ip.ts';
import { startNotifications } from '../apn/apn.ts';
import { startEventSubscription } from '../opencode/event-subscription.ts';
import { createIdentity } from '../stores/identity.ts';
import { createTailscale } from '../plugins/tailscale/tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { startNotificationTracker } from '../notification/tracker.ts';
import { getFeatureFlags } from '../feature-flags.ts';
import pkgJson from '../../package.json' with { type: 'json' };
import { isProd, SERVER_URL } from '../config/constants.ts';
import { logger } from '../logger.ts';
import { createOpencode } from '../opencode/opencode.ts';

export interface WhatcodeServerConfig {
  tailscale?: boolean;
  password?: string;
  port?: number;
  opencodePort?: number;
  logLevel?: LogLevel;
  hostname?: string;
}

export const createWhatcodeServer = async ({
  tailscale: hasTailscale,
  password,
  port = 8192,
  opencodePort = 4096,
  logLevel = 'none',
  hostname,
}: WhatcodeServerConfig = {}) => {
  logger.init({ logLevel });
  logger.info('whatcode', `started WhatCode${isProd ? '' : 'Dev'} on version ${pkgJson.version}`);
  if (!isProd) {
    logger.debug('relay', `Relay url: ${SERVER_URL}`);
  }

  const [opencodeData, ipData, flags] = await Promise.all([
    createOpencode({ port: opencodePort, password, hostname }),
    getLocalIp(),
    getFeatureFlags(),
  ]);

  if (opencodeData.error) return { error: opencodeData.error };
  if (ipData.error) return { error: ipData.error };

  const { server: opencodeServer, client, version: opencodeVersion } = opencodeData.data;

  // checkOpencodeMinVersion(opencodeVersion);
  const opencodePublicUrl = `http://${ipData.data}:${opencodePort.toString()}`;
  const daemonUrl = `http://${ipData.data}:${port.toString()}`;
  startEventSubscription(client);
  startNotifications(client);
  if (flags?.WHATCODE_NOTIFICATION_V2) {
    startNotificationTracker(client);
  }

  startWhatcode({ port, opencodePort: opencodePort, password, client });
  const tailscale = hasTailscale ? createTailscale(port) : undefined;
  const tailscaleServer = tailscale ? await tailscale.start() : undefined;

  const iResult = await createIdentity({
    opencode: { url: opencodePublicUrl, version: opencodeVersion, available: !!hostname },
    daemon: { url: daemonUrl, version: pkgJson.version, available: true },
    tailscale: { url: tailscaleServer?.url, available: !!tailscaleServer },
  });

  if (iResult.error) return { error: iResult.error };

  // clean up
  asyncExitHook(
    async () => {
      try {
        await tailscale?.stop();
        opencodeServer?.close();
      } catch (err) {
        logger.error('exit-hook', parseError(err).message, err);
      }
    },
    { wait: 3000 },
  );

  return { data: { url: tailscaleServer?.url ?? daemonUrl, version: pkgJson.version } };
};
