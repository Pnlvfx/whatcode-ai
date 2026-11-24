import type { WhatCodeClient } from '../opencode/client.ts';
import path from 'node:path';
import { gitError } from './git-error.ts';
import { checkRepoState } from './repo-state.ts';

export const prepareRepo = async (client: WhatCodeClient, directory: string) => {
  const known = await listProjectDirectories(client);
  if (known.error) return { error: known.error };
  const resolved = path.resolve(directory);
  if (!known.data.has(resolved)) return { error: gitError(403, 'Unknown project directory.') };
  const failure = await checkRepoState(resolved);
  return failure ? { error: failure } : { data: resolved };
};

export const findEscapingPath = (directory: string, filePaths: string[]) => {
  return filePaths.find((filePath) => !path.resolve(directory, filePath).startsWith(`${directory}${path.sep}`));
};

const listProjectDirectories = async (client: WhatCodeClient) => {
  const projects = await client.project.list();
  if (projects.error) return { error: gitError(400, projects.error.message) };
  const directories = projects.data.flatMap((project) => (project.vcs === 'git' ? [project.canonical, ...project.sandboxes] : []));
  return { data: new Set(directories.map((directory) => path.resolve(directory))) };
};
