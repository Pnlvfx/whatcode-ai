#!/usr/bin/env node
import { checkForUpdate } from './update.ts';
import { config } from './config.ts';
import { createWhatcodeServer, resetWhatcodeServer } from '@whatcode-ai/sdk';
import { printQrCode } from './qrcode.ts';
import { hideBin } from 'yargs/helpers';
import { logger } from '@whatcode-ai/sdk/internals/logger';
import pkg from '../package.json' with { type: 'json' };
import yargs from 'yargs';

await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .version(pkg.version)
  .usage('$0 [options]')
  .command(
    ['$0', 'start'],
    'Start WhatCode',
    (y) =>
      y
        .option('tailscale', { type: 'boolean', description: 'Expose WhatCode via Tailscale serve (HTTPS on your tailnet)' })
        .option('port', { type: 'number', description: 'Port for the WhatCode server (default: 8192)' })
        .option('opencode-port', { type: 'number', description: 'Port for the OpenCode server (default: 4096)' })
        .option('hostname', { type: 'string', description: 'Hostname to listen on' })
        .option('log-level', {
          type: 'string',
          choices: ['none', 'info', 'debug'] as const,
          default: 'info' as const,
          description: 'Log level: none | info | debug (default: info)',
        }),
    async ({ logLevel, opencodePort, tailscale, port, hostname }) => {
      await checkForUpdate(pkg.version);
      const { url } = await createWhatcodeServer({
        tailscale,
        ...(port !== undefined && { port }),
        ...(opencodePort !== undefined && { opencodePort }),
        logLevel,
        ...(config.WHATCODE_PASSWORD !== undefined && { password: config.WHATCODE_PASSWORD }),
        ...(hostname !== undefined && { hostname }),
      });

      if (url) {
        logger.info('whatcode', `use this URL in the app: ${url}`);
        printQrCode(url, config.WHATCODE_PASSWORD);
      } else {
        logger.warn('whatcode', 'could not determine local IP — find your machine IP in your network settings and connect manually');
      }
    },
  )
  .command(
    'reset',
    'Reset WhatCode.',
    (y) => y,
    async () => {
      logger.init({ logLevel: 'info' });
      await resetWhatcodeServer();
      logger.info('whatcode', 'reset completed successfully');
    },
  )
  .parseAsync();
