/* eslint-disable import-x/no-extraneous-dependencies */
/* eslint-disable parallelize/no-sequential-await */
import { rimraf } from '@goatjs/rimraf';
import { execa } from 'execa';

await rimraf(['build', '.docusaurus']);

await execa('pnpm', ['build'], { stdio: 'inherit' });
await execa('pnpm', ['wrangler', 'deploy'], { stdio: 'inherit' });
