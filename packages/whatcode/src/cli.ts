#!/usr/bin/env node
import { createWhatcodeServer } from '@whatcode-ai/sdk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const { hostname, tailscale, port, timeout, proxyPort, proxy } = await yargs(hideBin(process.argv))
  .scriptName('whatcode')
  .help()
  .strict()
  .version(false)
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
  .parseAsync();

await createWhatcodeServer({
  tailscale,
  ...(hostname !== undefined && { hostname }),
  ...(port !== undefined && { port }),
  ...(timeout !== undefined && { timeout }),
  ...(proxyPort !== undefined && { proxyPort }),
  ...(proxy !== undefined && { proxy }),
});
