#!/usr/bin/env node
import { createWhatcodeServer, resetWhatcodeServer } from '@whatcode-ai/sdk';
import { logger, logLevelSchema } from '@whatcode-ai/sdk/logger';
import { printQrCode } from './qrcode.ts';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import updateNotifier from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };

updateNotifier({ pkg }).notify();

const { tailscale, port, opencodePort, logLevel, password } = await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .version(false)
  .usage('$0 [options]')
  .option('tailscale', { type: 'boolean', description: 'Expose OpenCode via Tailscale serve (HTTPS on your tailnet)' })
  .option('port', { type: 'number', description: 'Port for the Whatcode server (default: 8192)' })
  .option('opencode-port', { type: 'number', description: 'Port for the OpenCode server (default: 4096)' })
  .option('log-level', {
    type: 'string',
    choices: ['none', 'info', 'debug'],
    default: 'info',
    description: 'Log level: none | info | debug (default: info)',
  })
  .option('password', { type: 'string', description: 'Password to protect the Whatcode and OpenCode servers (HTTP Basic Auth)' })
  .command(
    'reset',
    'Reset stored daemon data (APNs tokens). Use this if notifications stop working.',
    (y) => y,
    async () => {
      await resetWhatcodeServer();
    },
  )
  .parseAsync();

const { url } = await createWhatcodeServer({
  tailscale,
  ...(port !== undefined && { port }),
  ...(opencodePort !== undefined && { opencodePort }),
  logLevel: await logLevelSchema.parseAsync(logLevel),
  ...(password !== undefined && { password }),
});

if (url) {
  logger.info('whatcode', `use this URL in the app: ${url}`);
  printQrCode(url, password);
} else {
  logger.info('whatcode', 'could not determine local IP — find your machine IP in your network settings and connect manually');
}
