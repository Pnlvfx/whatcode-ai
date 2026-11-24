import { runGit } from './run-git.ts';

export const commitFiles = async (directory: string, message: string, filePaths: string[]) => {
  const added = await runGit(directory, ['add', '-A', '--', ...filePaths]);
  if (added.error) return added;
  const committed = await runGit(directory, ['commit', '-m', message, '--', ...filePaths]);
  return committed.error ? committed : readHead(directory);
};

export const pushBranch = async (directory: string) => {
  const upstream = await runGit(directory, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  return runGit(directory, upstream.error ? ['push', '--set-upstream', 'origin', 'HEAD'] : ['push']);
};

export const pullBranch = async (directory: string) => {
  const pulled = await runGit(directory, ['pull', '--ff-only']);
  return pulled.error ? pulled : { data: { upToDate: pulled.data.includes('Already up to date') }, error: undefined };
};

const readHead = async (directory: string) => {
  const [sha, branch] = await Promise.all([runGit(directory, ['rev-parse', '--short', 'HEAD']), runGit(directory, ['branch', '--show-current'])]);
  if (sha.error) return sha;
  if (branch.error) return branch;
  return { data: { commit: sha.data, branch: branch.data === '' ? undefined : branch.data }, error: undefined };
};
