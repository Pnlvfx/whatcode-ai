#!/usr/bin/env node
import { createWhatcodeServer } from '@whatcode-ai/sdk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// TODO add new options

const { hostname, notification, tailscale, port, timeout, proxyPort } = await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .usage('$0 [options]')
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
  .option('proxy-port', {
    alias: 'P',
    type: 'number',
    description: 'Port for the whatcode proxy server (default: opencode port + 1)',
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
  ...(proxyPort !== undefined && { proxyPort }),
});
