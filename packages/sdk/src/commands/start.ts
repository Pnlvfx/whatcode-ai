import type { LogLevel } from '../compiled/node/logger.ts';
import { parseError } from '../compiled/core/error.ts';
import { opencode } from '../opencode/opencode.ts';
import { opencodeV2 } from '../opencode2/opencode2.ts';
import { startWhatcode } from '../server.ts';
import { getLocalIp } from '../ip.ts';
import { startNotifications } from '../apn/apn.ts';
import { startEventSubscription } from '../opencode/event-subscription.ts';
import { startV2EventSubscription } from '../opencode2/event-subscription.ts';
import { createIdentity } from '../stores/identity.ts';
import { startTailscale } from '../tailscale.ts';
import { createTailscale } from '../plugins/tailscale/tailscale.ts';
import { asyncExitHook } from 'exit-hook';
import { startNotificationTracker } from '../notification/tracker.ts';
import { getFeatureFlags } from '../feature-flags.ts';
import { isProd } from '../config/constants.ts';
import { logger } from '../logger.ts';
import pkgJson from '../../package.json' with { type: 'json' };

export interface WhatcodeServerResult {
  url: string | undefined;
  version: string;
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
  logger.info('whatcode', `started WhatCode${isProd ? '' : 'Dev'} on version ${pkgJson.version}`);

  const [v2, localIp, flags] = await Promise.all([opencodeV2(), getLocalIp(), getFeatureFlags()]);

  const daemonUrl = `http://${localIp}:${port.toString()}`;
  const tailscale = hasTailscale ? createTailscale(port) : undefined;
  const tailscaleUrl = tailscale ? await startTailscale(tailscale) : undefined;

  if (v2) {
    logger.info('whatcode', `using opencode2 at ${v2.url} (v${v2.version})`);

    startV2EventSubscription(v2.client);

    // apn notifications and server.ts project listing not yet ported to V2

    await createIdentity({
      opencode: { url: v2.url, version: v2.version, available: true },
      daemon: { url: daemonUrl, version: pkgJson.version, available: true },
      tailscale: { url: tailscaleUrl, available: !!tailscaleUrl },
    });
  } else {
    logger.info('whatcode', 'opencode2 not found, falling back to V1');

    const { server: opencodeServer, client, version: opencodeVersion } = await opencode({ port: opencodePort, password, hostname });

    const opencodePublicUrl = `http://${localIp}:${opencodePort.toString()}`;
    startEventSubscription(client);
    startNotifications(client);
    if (flags?.WHATCODE_NOTIFICATION_V2) {
      startNotificationTracker(client);
    }

    startWhatcode({ port, opencodePort, password, client });

    await createIdentity({
      opencode: { url: opencodePublicUrl, version: opencodeVersion, available: !!hostname },
      daemon: { url: daemonUrl, version: pkgJson.version, available: true },
      tailscale: { url: tailscaleUrl, available: !!tailscaleUrl },
    });

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
  }

  return { url: tailscaleUrl ?? daemonUrl, version: pkgJson.version };
};
