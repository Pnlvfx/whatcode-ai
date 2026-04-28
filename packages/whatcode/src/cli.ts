#!/usr/bin/env node
import { createWhatcodeServer, resetWhatcodeServer } from '@whatcode-ai/sdk';
import { logger } from '@whatcode-ai/sdk/logger';
import { printQrCode } from './qrcode.ts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import updateNotifier from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };

try {
  process.loadEnvFile();
} catch {
  logger.debug('env', 'no .env file present, using defaults');
}

updateNotifier({ pkg }).notify();

const { tailscale, reset, port, opencodePort, debug, password } = await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .version(false)
  .usage('$0 [options]')
  .option('reset', { type: 'boolean', description: 'Reset Whatcode server, disconnect all active devices.' })
  .option('tailscale', { type: 'boolean', description: 'Expose opencode via Tailscale serve (HTTPS on your tailnet)' })
  .option('port', { type: 'number', description: 'Port for the Whatcode server (default: 8192)' })
  .option('opencode-port', { type: 'number', description: 'Port for the opencode server (default: 4096)' })
  .option('debug', { type: 'boolean', description: 'Enable debug logs (APN tokens, internal events, etc.)' })
  .option('password', { type: 'string', description: 'Password to protect the Whatcode and opencode servers (HTTP Basic Auth)' })
  .parseAsync();

if (reset) {
  await resetWhatcodeServer();
}

const { url } = await createWhatcodeServer({
  tailscale,
  ...(port !== undefined && { port }),
  ...(opencodePort !== undefined && { opencodePort }),
  ...(debug !== undefined && { debug }),
  ...(password !== undefined && { password }),
});

if (url) {
  logger.info('whatcode', `use this URL in the app: ${url}`);
  printQrCode(url, password);
} else {
  logger.info('whatcode', 'could not determine local IP — find your machine IP in your network settings and connect manually');
}
