import { opencode } from '../opencode/opencode.ts';
import { startWhatcode } from '../server.ts';
import { getLocalIp } from '../ip.ts';
import { startNotifications } from '../apn/apn.ts';
import { startEventSubscription } from '../opencode/event-subscription.ts';
import { identityStore } from '../stores/identity.ts';
import { startTailscale } from '../tailscale.ts';
import { createTailscale } from '../plugins/tailscale/tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { logger, type LogLevel } from '../compiled/node/logger.ts';
import pkgJson from '../../package.json' with { type: 'json' };
import { parseError } from '../compiled/core/error.ts';
import { startNotificationTracker } from '../notification/tracker.ts';
import { getFeatureFlags } from '../feature-flags.ts';

export interface WhatcodeServerResult {
  url: string | undefined;
}

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
}: WhatcodeServerConfig = {}): Promise<WhatcodeServerResult> => {
  logger.init({ logLevel });

  const [{ server: opencodeServer, client, version: opencodeVersion }, localIp, flags] = await Promise.all([
    opencode({ port: opencodePort, password, hostname }),
    getLocalIp(),
    getFeatureFlags(),
  ]);

  // checkOpencodeMinVersion(opencodeVersion);
  const opencodePublicUrl = `http://${localIp}:${opencodePort.toString()}`;
  const daemonUrl = `http://${localIp}:${port.toString()}`;
  startEventSubscription(client);
  startNotifications(client);
  if (flags?.WHATCODE_NOTIFICATION_V2) {
    startNotificationTracker(client);
  }

  startWhatcode({ port, opencodePort: opencodePort, password, client });
  const tailscale = hasTailscale ? createTailscale(port) : undefined;
  const tailscaleUrl = tailscale ? await startTailscale(tailscale) : undefined;

  await identityStore.set({
    opencode: { url: opencodePublicUrl, version: opencodeVersion, available: !!hostname },
    daemon: { url: daemonUrl, version: pkgJson.version, available: true },
    tailscale: { url: tailscaleUrl, available: !!tailscaleUrl },
  });

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

  return { url: tailscaleUrl ?? daemonUrl };
};
