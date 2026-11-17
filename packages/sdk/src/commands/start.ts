import type { LogLevel } from '../compiled/node/logger.ts';
import { startWhatcode } from '../server.ts';
import { getLocalIp } from '../ip.ts';
import { createIdentity } from '../stores/identity.ts';
import { resolvePassword } from '../stores/password.ts';
import { getGlobalConfig } from '../stores/global-config.ts';
import { clearDaemonUrl, saveDaemonUrl } from '../stores/daemon-url.ts';
import { createTunnel } from '../plugins/tunnel/tunnel.ts';
import { asyncExitHook } from 'exit-hook';
import { DEFAULT_PORT, isProd, SERVER_URL } from '../config/constants.ts';
import { logger } from '../logger.ts';
import { createOpencode } from '../opencode/service.ts';
import { authenticate } from '../auth/auth.ts';
import { startNotifications } from '../apn/apn.ts';
import { startScheduler } from '../scheduler/scheduler.ts';
import { startEventSubscription } from '../opencode/event-subscription.ts';
import { createTailscale } from '../compiled/tailscale/tailscale.ts';
import pkgJson from '../../package.json' with { type: 'json' };

export interface WhatcodeServerConfig {
  tailscale?: boolean | undefined;
  tunnel?: boolean | undefined;
  password?: string | undefined;
  port?: number | undefined;
  logLevel?: LogLevel | undefined;
}

export const createWhatcodeServer = async (options: WhatcodeServerConfig = {}) => {
  const resolved = await resolveOptions(options);
  if (resolved.error) return { error: resolved.error };
  const { tailscale: hasTailscale, tunnel: hasTunnel, password, port, logLevel } = resolved.data;
  logger.init({ logLevel });
  if (hasTailscale && hasTunnel) return { error: { type: 'config' as const, message: EXCLUSIVE_MESSAGE } };
  logger.debug('whatcode', `starting WhatCode${isProd ? '' : 'Dev'} on version ${pkgJson.version}...`);

  if (!isProd) {
    logger.debug('relay', `Relay url: ${SERVER_URL}`);
  }

  const [relayAuth, opencodeData, ipData, passwordData] = await Promise.all([
    authenticate(),
    createOpencode(),
    getLocalIp(),
    resolvePassword(password),
  ]);

  if (relayAuth.error) return { error: { type: 'relay' as const, message: relayAuth.error.message } };
  if (ipData.error) return { error: ipData.error };
  if (passwordData.error) return { error: passwordData.error };
  if (opencodeData.error) return { error: opencodeData.error };

  const { client, endpoint } = opencodeData.data;

  // checkOpencodeMinVersion(opencodeVersion);
  const daemonUrl = `http://${ipData.data}:${port.toString()}`;
  startEventSubscription(client);
  startNotifications(client);
  startScheduler(client);
  // if (flags?.WHATCODE_NOTIFICATION_V2) {
  //   startNotificationTracker(client);
  // }

  await startWhatcode({ port, endpoint, password: passwordData.data, client });
  const tailscale = hasTailscale ? createTailscale({ logLevel }) : undefined;
  const tunnel = hasTunnel ? createTunnel(port) : undefined;
  const [tailscaleServer, tunnelServer] = await Promise.all([tailscale?.serveSession({ port }), tunnel?.start()]);
  const url = tailscaleServer?.url ?? tunnelServer?.url ?? daemonUrl;
  const [iResult, urlResult] = await Promise.all([
    createIdentity({ daemon: daemonUrl, tailscale: tailscaleServer?.url, tunnel: tunnelServer?.url }),
    saveDaemonUrl(url),
  ]);

  if (iResult.error) return { error: iResult.error };
  if (urlResult.error) return { error: urlResult.error };

  // clean up
  asyncExitHook(
    async () => {
      await Promise.all([tunnel?.stop(), clearDaemonUrl()]);
    },
    { wait: 3000 },
  );

  return {
    data: { url, version: pkgJson.version },
  };
};

const EXCLUSIVE_MESSAGE = 'Tailscale and tunnel are mutually exclusive, enable only one of them (check the flags and the global config).';

// Precedence: explicit options, then the global config file, then the built-in defaults.
const resolveOptions = async ({ tailscale, tunnel, password, port, logLevel }: WhatcodeServerConfig) => {
  const globalConfig = await getGlobalConfig();
  if (globalConfig.error) return { error: globalConfig.error };

  return {
    data: {
      password,
      tailscale: tailscale ?? globalConfig.data.tailscale,
      tunnel: tunnel ?? globalConfig.data.tunnel,
      port: port ?? globalConfig.data.port ?? DEFAULT_PORT,
      logLevel: logLevel ?? globalConfig.data.logLevel ?? 'none',
    },
  };
};
