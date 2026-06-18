import { rimraf } from '@goatjs/rimraf';
import { createGitClient } from '@goatjs/node/git';
import { execa } from 'execa';
import { dbz } from '@goatjs/dbz';
import { getPkgJSON } from '@goatjs/zod/helpers/package-json';
import path from 'node:path';

const git = createGitClient();
await dbz.checkGitStatus(git);

await rimraf(['build', '.docusaurus']);

await execa('yarn', ['vercel', 'pull', '--yes'], { stdio: 'inherit' });
await execa('yarn', ['vercel', 'build', '--prod'], { stdio: 'inherit' });
await execa('yarn', ['vercel', 'deploy', '--prebuilt', '--prod'], { stdio: 'inherit' });

try {
  await execa('yarn', ['version', 'minor']);
  const packageJson = await getPkgJSON(path.resolve('.'));
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
