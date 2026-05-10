import { rimraf } from '@goatjs/rimraf';
import { createGitClient } from '@goatjs/node/git';
import { checkGitStatus } from '@goatjs/dbz/git';
import { execa } from 'execa';
import { getPkgJSON } from '@goatjs/node/package-json';

const git = createGitClient();
await checkGitStatus();

await rimraf(['build', '.docusaurus']);

const { name, version } = await getPkgJSON('package.json');

await execa('yarn', ['vercel', 'pull', '--yes'], { stdio: 'inherit' });
await execa('yarn', ['vercel', 'build', '--prod'], { stdio: 'inherit' });
await execa('yarn', ['vercel', 'deploy', '--prebuilt', '--prod'], { stdio: 'inherit' });

try {
  await execa('yarn', ['version', 'minor']);
  await git.add();
  await git.commit(`chore(release): publish ${name}`);
  await git.push();
  await git.createTag(`${name}@${version}`);
  await git.pushTags();
} catch (err) {
  await git.checkout('.');
  throw err;
}
