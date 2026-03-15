import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createWhatcodeServer } from './index.ts';

const { tailscale, hostname, port, timeout } = await yargs(hideBin(process.argv))
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
  .option('timeout', {
    type: 'number',
    description: 'Timeout in milliseconds for the opencode server to start',
  })
  .parseAsync();

await createWhatcodeServer({ tailscale, hostname, port, timeout });
