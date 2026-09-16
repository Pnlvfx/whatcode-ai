/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable parallelize/no-sequential-await */
import { rimraf } from '@goatjs/rimraf';
import { createGitClient } from '@goatjs/node/git';
import { execa } from 'execa';
import { dbz } from '@goatjs/dbz';
import { getPkgJSON } from '@goatjs/zod/package-json';
import path from 'node:path';

const git = createGitClient();
await dbz.checkGitStatus(git);

await rimraf(['build', '.docusaurus']);

await execa('pnpm', ['vercel', 'pull', '--yes'], { stdio: 'inherit' });
await execa('pnpm', ['vercel', 'build', '--prod'], { stdio: 'inherit' });
await execa('pnpm', ['vercel', 'deploy', '--prebuilt', '--prod'], { stdio: 'inherit' });

try {
  await dbz.bumpVersion(path.resolve('.'), 'minor');
  const packageJson = await getPkgJSON(path.resolve('.', 'package.json'));
  if (!packageJson.version) throw new Error('Deploy error');
  await git.add();
  await git.commit(`chore(release): publish ${packageJson.name}`);
  await git.push();
  await git.createTag(`${packageJson.name}@${packageJson.version}`);
  await git.pushTags();
} catch (err) {
  await git.checkout('.');
  throw err;
}
