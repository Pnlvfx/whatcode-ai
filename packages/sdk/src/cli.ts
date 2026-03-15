import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createWhatcodeServer } from './index.ts';

const { tailscale } = await yargs(hideBin(process.argv))
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
  .parseAsync();

await createWhatcodeServer({ tailscale });
