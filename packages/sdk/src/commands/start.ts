import type { LogLevel } from '../compiled/node/logger.ts';
import { parseError } from '../compiled/core/error.ts';
import { startWhatcode } from '../server.ts';
import { getLocalIp } from '../ip.ts';
import { createIdentity } from '../stores/identity.ts';
import { resolvePassword } from '../stores/password.ts';
import { getGlobalConfig } from '../stores/global-config.ts';
import { clearDaemonUrl, saveDaemonUrl } from '../stores/daemon-url.ts';
import { createTailscale } from '../plugins/tailscale/tailscale.ts';
import { createTunnel } from '../plugins/tunnel/tunnel.ts';
import { asyncExitHook } from 'exit-hook';
import { DEFAULT_PORT, isProd, SERVER_URL } from '../config/constants.ts';
import { logger } from '../logger.ts';
import { createOpencode } from '../opencode/opencode.ts';
import { isServerRunning } from '../net.ts';
import { authenticate } from '../auth/auth.ts';
import { startNotifications } from '../apn/apn.ts';
import { startScheduler } from '../scheduler/scheduler.ts';
import { startEventSubscription } from '../opencode/event-subscription.ts';
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

  const isRunning = await isServerRunning(port);
  if (isRunning) return { error: { type: 'server' as const, message: 'The Daemon is already running on this machine!' } };

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

  if (relayAuth.error) return { error: { type: 'relay' as const, message: relayAuth.error.value.message ?? relayAuth.error.status.toString() } };
  if (ipData.error) return { error: ipData.error };
  if (passwordData.error) return { error: passwordData.error };

  const { client, endpoint } = opencodeData;

  // checkOpencodeMinVersion(opencodeVersion);
  const daemonUrl = `http://${ipData.data}:${port.toString()}`;
  startEventSubscription(client);
  startNotifications(client);
  startScheduler(client);
  // if (flags?.WHATCODE_NOTIFICATION_V2) {
  //   startNotificationTracker(client);
  // }

  await startWhatcode({ port, endpoint, password: passwordData.data, client });
  const tailscale = hasTailscale ? createTailscale(port) : undefined;
  const tunnel = hasTunnel ? createTunnel(port) : undefined;
  const [tailscaleServer, tunnelServer] = await Promise.all([tailscale?.start(), tunnel?.start()]);

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
      try {
        await Promise.all([tailscale?.stop(), tunnel?.stop(), clearDaemonUrl()]);
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
