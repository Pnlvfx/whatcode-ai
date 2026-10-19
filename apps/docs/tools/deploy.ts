/* eslint-disable import-x/no-extraneous-dependencies */
/* eslint-disable parallelize/no-sequential-await */
import { rimraf } from '@goatjs/rimraf';
import { execa } from 'execa';

await rimraf(['build', '.docusaurus']);

await execa('pnpm', ['vercel', 'pull', '--yes'], { stdio: 'inherit' });
await execa('pnpm', ['vercel', 'build', '--prod'], { stdio: 'inherit' });
await execa('pnpm', ['vercel', 'deploy', '--prebuilt', '--prod']);
