import type { LogLevel } from '../compiled/node/logger.ts';
import { parseError } from '../compiled/core/error.ts';
import { startWhatcode } from '../server.ts';
import { getLocalIp } from '../ip.ts';
import { createIdentity } from '../stores/identity.ts';
import { resolvePassword } from '../stores/password.ts';
import { clearDaemonUrl, saveDaemonUrl } from '../stores/daemon-url.ts';
import { createTailscale } from '../plugins/tailscale/tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { DEFAULT_PORT, isProd, SERVER_URL } from '../config/constants.ts';
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

export const createWhatcodeServer = async ({ tailscale: hasTailscale, password, port = DEFAULT_PORT, logLevel = 'none' }: WhatcodeServerConfig = {}) => {
  logger.init({ logLevel });

  const isRunning = await isServerRunning(port);
  if (isRunning) return { error: { type: 'server' as const, message: 'The Daemon is already running on this machine!' } };

  logger.info('whatcode', `starting WhatCode${isProd ? '' : 'Dev'} on version ${pkgJson.version}...`);

  if (!isProd) {
    logger.debug('relay', `Relay url: ${SERVER_URL}`);
  }

  const [relayAuth, opencodeData, ipData, passwordData] = await Promise.all([authenticate(), createOpencode(), getLocalIp(), resolvePassword(password)]);

  if (relayAuth.error) return { error: { type: 'relay' as const, message: relayAuth.error.value.message ?? relayAuth.error.status.toString() } };
  if (ipData.error) return { error: ipData.error };
  if (passwordData.error) return { error: passwordData.error };

  const { client, endpoint } = opencodeData;

  // checkOpencodeMinVersion(opencodeVersion);
  const daemonUrl = `http://${ipData.data}:${port.toString()}`;
  startEventSubscription(client);
  startNotifications(client);
  // if (flags?.WHATCODE_NOTIFICATION_V2) {
  //   startNotificationTracker(client);
  // }

  await startWhatcode({ port, endpoint, password: passwordData.data, client });
  const tailscale = hasTailscale ? createTailscale(port) : undefined;
  const tailscaleServer = tailscale ? await tailscale.start() : undefined;

  const url = tailscaleServer?.url ?? daemonUrl;
  const [iResult, urlResult] = await Promise.all([createIdentity({ daemon: daemonUrl, tailscale: tailscaleServer?.url }), saveDaemonUrl(url)]);

  if (iResult.error) return { error: iResult.error };
  if (urlResult.error) return { error: urlResult.error };

  // clean up
  asyncExitHook(
    async () => {
      try {
        await Promise.all([tailscale?.stop(), clearDaemonUrl()]);
      } catch (err) {
        logger.error('exit-hook', parseError(err).message, err);
      }
    },
    { wait: 3000 },
  );

  return {
    data: { url, version: pkgJson.version },
  };
};
