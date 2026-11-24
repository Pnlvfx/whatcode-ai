import { readdir } from 'node:fs/promises';
import { safeTryCatch } from '../compiled/core/try-catch.ts';
import { gitError } from './git-error.ts';
import { runGit } from './run-git.ts';

const IN_PROGRESS_MARKERS = new Set(['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']);

export const checkRepoState = async (directory: string) => {
  const gitDir = await runGit(directory, ['rev-parse', '--absolute-git-dir']);
  if (gitDir.error) return gitDir.error;
  const [entries, unmerged] = await Promise.all([safeTryCatch(readdir(gitDir.data)), runGit(directory, ['ls-files', '--unmerged'])]);
  if (entries.error) return gitError(400, entries.error.message);
  if (unmerged.error) return unmerged.error;
  if (entries.data.some((entry) => IN_PROGRESS_MARKERS.has(entry))) {
    return gitError(409, 'A merge, rebase or cherry-pick is in progress. Finish or abort it on your computer first.');
  }
  return unmerged.data === '' ? undefined : gitError(409, 'There are unresolved merge conflicts. Resolve them on your computer first.');
};
