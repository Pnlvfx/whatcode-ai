import type { WhatCodeClient } from '../opencode/client.ts';
import type { Failure, Success } from '../compiled/core/try-catch.ts';
import type { GitFailure } from './repo-state.ts';
import path from 'node:path';
import { checkRepoState } from './repo-state.ts';

type GitResult<T> = Success<T> | Failure<GitFailure>;

export const prepareRepo = async (client: WhatCodeClient, directory: string): Promise<GitResult<string>> => {
  const known = await listProjectDirectories(client);
  if (known.error) return { error: known.error };
  const resolved = path.resolve(directory);
  if (!known.data.has(resolved)) return { error: { status: 403, message: 'Unknown project directory.' } };
  const failure = await checkRepoState(resolved);
  return failure ? { error: failure } : { data: resolved };
};

export const findEscapingPath = (directory: string, filePaths: string[]) => {
  return filePaths.find((filePath) => !path.resolve(directory, filePath).startsWith(`${directory}${path.sep}`));
};

const listProjectDirectories = async (client: WhatCodeClient): Promise<GitResult<Set<string>>> => {
  const projects = await client.project.list();
  if (projects.error) return { error: { status: 400, message: projects.error.message } };
  const directories = projects.data.flatMap((project) => (project.vcs === 'git' ? [project.canonical, ...project.sandboxes] : []));
  return { data: new Set(directories.map((directory) => path.resolve(directory))) };
};
