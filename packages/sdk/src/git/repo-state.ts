import { readdir } from 'node:fs/promises';
import { safeTryCatch } from '../compiled/core/try-catch.ts';
import { runGit } from './run-git.ts';

export interface GitFailure {
  status: 400 | 403 | 409;
  message: string;
}

const IN_PROGRESS_MARKERS = new Set(['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply']);

export const checkRepoState = async (directory: string): Promise<GitFailure | undefined> => {
  const gitDir = await runGit(directory, ['rev-parse', '--absolute-git-dir']);
  if (gitDir.error) return { status: 400, message: gitDir.error.message };
  const [entries, unmerged] = await Promise.all([safeTryCatch<string[], Error>(readdir(gitDir.data)), runGit(directory, ['ls-files', '--unmerged'])]);
  if (entries.error) return { status: 400, message: entries.error.message };
  if (unmerged.error) return { status: 400, message: unmerged.error.message };
  if (entries.data.some((entry) => IN_PROGRESS_MARKERS.has(entry))) {
    return { status: 409, message: 'A merge, rebase or cherry-pick is in progress. Finish or abort it on your computer first.' };
  }
  return unmerged.data === '' ? undefined : { status: 409, message: 'There are unresolved merge conflicts. Resolve them on your computer first.' };
};
