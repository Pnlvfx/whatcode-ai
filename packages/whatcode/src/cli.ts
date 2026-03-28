#!/usr/bin/env node
import { createWhatcodeServer, saveToken } from '@whatcode-ai/sdk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { hostname, notification, tailscale, port, timeout } = await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .usage('$0 [options]')
  .command(
    'token <token>',
    'Save a push notification token',
    (y) => y.positional('token', { type: 'string', demandOption: true, description: 'APNs device token copied from the whatcode app' }),
    async ({ token }) => {
      await saveToken(token);
      process.exit(0);
    },
  )
  .option('tailscale', {
    alias: 't',
    type: 'boolean',
    default: false,
    description: 'Expose opencode via Tailscale serve (HTTPS on your tailnet)',
  })
  .option('hostname', {
    alias: 'H',
    type: 'string',
    description: 'Hostname to bind the opencode server to (default: 0.0.0.0)',
  })
  .option('port', {
    alias: 'p',
    type: 'number',
    description: 'Port to bind the opencode server to (default: 4096)',
  })
  .option('timeout', {
    type: 'number',
    description: 'Timeout in milliseconds for the opencode server to start',
  })
  .option('notification', {
    alias: 'n',
    type: 'boolean',
    default: false,
    description: 'Enable push notifications (requires token registered via: whatcode token <token>)',
  })
  .parseAsync();

await createWhatcodeServer({
  tailscale,
  notification,
  ...(hostname !== undefined && { hostname }),
  ...(port !== undefined && { port }),
  ...(timeout !== undefined && { timeout }),
});
