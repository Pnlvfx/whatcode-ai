#!/usr/bin/env node
/* eslint-disable no-console */
import { config } from './config.ts';
import { createWhatcodeServer, resetWhatcodeServer } from '@whatcode-ai/sdk';
import { printQrCode } from './qrcode.ts';
import { hideBin } from 'yargs/helpers';
import updateNotifier from 'update-notifier';
import pkg from '../package.json' with { type: 'json' };
import yargs from 'yargs';

updateNotifier({ pkg }).notify();

await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .version(false)
  .usage('$0 [options]')
  .command(
    ['$0', 'start'],
    'Start Whatcode',
    (y) =>
      y
        .option('tailscale', { type: 'boolean', description: 'Expose OpenCode via Tailscale serve (HTTPS on your tailnet)' })
        .option('port', { type: 'number', description: 'Port for the Whatcode server (default: 8192)' })
        .option('opencode-port', { type: 'number', description: 'Port for the OpenCode server (default: 4096)' })
        .option('hostname', {
          type: 'string',
          description: 'Hostname or IP to advertise as the OpenCode public address (overrides auto-detected local IP)',
        })
        .option('log-level', {
          type: 'string',
          choices: ['none', 'info', 'debug'],
          default: 'info',
          description: 'Log level: none | info | debug (default: info)',
        }),
    async ({ logLevel, opencodePort, tailscale, port, hostname }) => {
      const { url } = await createWhatcodeServer({
        tailscale,
        ...(port !== undefined && { port }),
        ...(opencodePort !== undefined && { opencodePort }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        logLevel: logLevel as 'none',
        ...(config.WHATCODE_PASSWORD !== undefined && { password: config.WHATCODE_PASSWORD }),
        ...(hostname !== undefined && { hostname }),
      });

      if (url) {
        console.log('whatcode', `use this URL in the app: ${url}`);
        printQrCode(url, config.WHATCODE_PASSWORD);
      } else {
        console.log('whatcode', 'could not determine local IP — find your machine IP in your network settings and connect manually');
      }
    },
  )
  .command(
    'reset',
    'Reset Whatcode.',
    (y) => y,
    async () => {
      try {
        await resetWhatcodeServer();
        console.log('whatcode', 'reset completed successfully');
      } catch (err) {
        console.log('whatcode', 'reset failed:', err);
        throw err;
      }
    },
  )
  .parseAsync();
