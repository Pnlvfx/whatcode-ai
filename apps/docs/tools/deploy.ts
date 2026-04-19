import { rimraf } from '@goatjs/rimraf';
import { spawnWithLog } from '@goatjs/dbz/spawn';
import { createGitClient } from '@goatjs/node/git';
import { checkGitStatus } from '@goatjs/dbz/git';
import { execa } from 'execa';

// TODO replace this imports with public packages

const git = createGitClient();
await checkGitStatus();

await rimraf(['build', '.docusaurus']);

try {
  await spawnWithLog('yarn', ['vercel', 'pull', '--yes']);
  await spawnWithLog('yarn', ['vercel', 'build', '--prod']);
  await spawnWithLog('yarn', ['vercel', 'deploy', '--prebuilt', '--prod']);
  await execa('yarn', ['version', 'minor']);
  await git.add();
  await git.commit('RELEASE');
  await git.push();
} catch (err) {
  await git.checkout('.');
  throw err;
}
