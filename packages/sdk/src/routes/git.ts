import type { WhatCodeClient } from '../opencode/client.ts';
import { Elysia } from 'elysia';
import { findEscapingPath, prepareRepo } from '../git/prepare.ts';
import { commitFiles, pullBranch, pushBranch } from '../git/operations.ts';
import { commitBody, directoryBody } from '../types/git.ts';

export const createGitRouter = (client: WhatCodeClient) => {
  return new Elysia({ prefix: '/api/git' })
    .post(
      '/commit',
      async ({ body, status }) => {
        const repo = await prepareRepo(client, body.directory);
        if (repo.error) return status(repo.error.status, { message: repo.error.message });
        const escaping = findEscapingPath(repo.data, body.filePaths);
        if (escaping !== undefined) return status(400, { message: `Path is outside the project: ${escaping}` });
        const result = await commitFiles(repo.data, body.message, body.filePaths);
        return result.error ? status(400, { message: result.error.message }) : result.data;
      },
      { body: commitBody },
    )
    .post(
      '/push',
      async ({ body, status }) => {
        const repo = await prepareRepo(client, body.directory);
        if (repo.error) return status(repo.error.status, { message: repo.error.message });
        const result = await pushBranch(repo.data);
        return result.error ? status(400, { message: result.error.message }) : { status: 'success' };
      },
      { body: directoryBody },
    )
    .post(
      '/pull',
      async ({ body, status }) => {
        const repo = await prepareRepo(client, body.directory);
        if (repo.error) return status(repo.error.status, { message: repo.error.message });
        const result = await pullBranch(repo.data);
        return result.error ? status(400, { message: result.error.message }) : result.data;
      },
      { body: directoryBody },
    );
};
