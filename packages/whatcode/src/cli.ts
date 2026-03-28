#!/usr/bin/env node
import { createWhatcodeServer, saveToken } from '@whatcode-ai/sdk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .usage('$0 [options]')
  .command('token <token>', 'Save a push notification token', (y) =>
    y.positional('token', { type: 'string', demandOption: true, description: 'APNs device token copied from the whatcode app' }),
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
  .option('notifications', {
    alias: 'n',
    type: 'boolean',
    default: false,
    description: 'Enable push notifications (requires token registered via: whatcode token <token>)',
  });

const parsed = await argv.parseAsync();

if (parsed._.includes('token')) {
  await saveToken(parsed['token'] as string);
  process.exit(0);
}

const { tailscale, hostname, port, timeout, notifications } = parsed;

await createWhatcodeServer({
  tailscale,
  flags: { notifications },
  ...(hostname !== undefined && { hostname }),
  ...(port !== undefined && { port }),
  ...(timeout !== undefined && { timeout }),
});
