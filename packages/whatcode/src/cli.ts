#!/usr/bin/env node

import { config } from './config.ts';
import { checkForUpdate } from './update.ts';
import { selfUpdate } from './self-update.ts';
import { createWhatcodeServer, resetWhatcodeServer } from '@whatcode-ai/sdk';
import { printQrCode } from './qrcode.ts';
import { getPairing } from './pair.ts';
import { hideBin } from 'yargs/helpers';
import { logger } from '@whatcode-ai/sdk/internals';
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
        .option('log-level', {
          type: 'string',
          choices: ['none', 'info', 'debug'] as const,
          default: 'info' as const,
          description: 'Log level: none | info | debug (default: info)',
        }),
    async ({ logLevel, tailscale, port }) => {
      const server = await createWhatcodeServer({
        tailscale,
        ...(port !== undefined && { port }),
        logLevel,
        ...(config.WHATCODE_PASSWORD !== undefined && { password: config.WHATCODE_PASSWORD }),
      });

      if (server.error) {
        logger.error('whatcode', server.error.message, server.error);
      } else {
        logger.info('whatcode', 'run "whatcode pair" to connect');
        logger.warn('whatcode', 'keep this running, closing it will disconnect the app');
      }

      await checkForUpdate(pkg.version);
    },
  )
  .command(
    'pair',
    'Show the URL, password and QR code to connect the app (WhatCode must be started).',
    (y) => y,
    async () => {
      logger.init({ logLevel: 'info' });
      const pairing = await getPairing();
      if (pairing.error) {
        logger.error('whatcode', pairing.error.message, pairing.error);
        process.exitCode = 1;
        return;
      }
      logger.info('whatcode', `url: ${pairing.data.url}`);
      logger.info('whatcode', `password: ${pairing.data.password}`);
      printQrCode(pairing.data.url, pairing.data.password);
    },
  )
  .command(
    'reset',
    'Reset WhatCode.',
    (y) => y,
    async () => {
      logger.init({ logLevel: 'info' });
      const result = await resetWhatcodeServer();
      if (result.error) {
        logger.error('whatcode', result.error.message, result.error);
        process.exitCode = 1;
        return;
      }
      logger.info('whatcode', 'reset completed successfully');
    },
  )
  .command(
    'update',
    'Update WhatCode to the latest version.',
    (y) => y,
    async () => {
      logger.init({ logLevel: 'info' });
      await selfUpdate(pkg.version);
    },
  )
  .parseAsync();
