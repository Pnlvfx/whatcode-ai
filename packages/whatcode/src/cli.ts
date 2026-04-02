#!/usr/bin/env node
import { createWhatcodeServer } from '@whatcode-ai/sdk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { hostname, notification, tailscale, port, timeout, proxyPort } = await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .usage('$0 [options]')
  .option('tailscale', {
    type: 'boolean',
    description: 'Expose opencode via Tailscale serve (HTTPS on your tailnet)',
  })
  .option('hostname', {
    type: 'string',
    description: 'Hostname to bind the opencode server to (default: 0.0.0.0)',
  })
  .option('port', {
    type: 'number',
    description: 'Port to bind the opencode server to (default: 4096)',
  })
  .option('proxy', {
    type: 'boolean',
    description: 'Enable Whatcode proxy to have a better ux experience.',
  })
  .option('proxy-port', {
    type: 'number',
    description: 'Port for the whatcode proxy server (default: opencode port + 1)',
  })
  .option('timeout', {
    type: 'number',
    description: 'Timeout in milliseconds for the opencode server to start',
  })
  .option('notification', {
    type: 'boolean',
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
