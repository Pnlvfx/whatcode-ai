import type { WhatCodeClient } from '../opencode/client.ts';
import { sValidator } from '@hono/standard-validator';
import { Hono } from 'hono';
import { findEscapingPath, prepareRepo } from '../git/prepare.ts';
import { commitFiles, pullBranch, pushBranch } from '../git/operations.ts';
import { commitBody, directoryBody } from '../types/git.ts';
import { invalidRequest } from '../validation.ts';

export const createGitRouter = (client: WhatCodeClient) => {
  return new Hono()
    .basePath('/api/git')
    .post('/commit', sValidator('json', commitBody, invalidRequest), async (c) => {
      const body = c.req.valid('json');
      const repo = await prepareRepo(client, body.directory);
      if (repo.error) return c.json({ message: repo.error.message }, repo.error.status);
      const escaping = findEscapingPath(repo.data, body.filePaths);
      if (escaping !== undefined) return c.json({ message: `Path is outside the project: ${escaping}` }, 400);
      const result = await commitFiles(repo.data, body.message, body.filePaths);
      return result.error ? c.json({ message: result.error.message }, 400) : c.json(result.data, 200);
    })
    .post('/push', sValidator('json', directoryBody, invalidRequest), async (c) => {
      const repo = await prepareRepo(client, c.req.valid('json').directory);
      if (repo.error) return c.json({ message: repo.error.message }, repo.error.status);
      const result = await pushBranch(repo.data);
      return result.error ? c.json({ message: result.error.message }, 400) : c.json({ status: 'success' }, 200);
    })
    .post('/pull', sValidator('json', directoryBody, invalidRequest), async (c) => {
      const repo = await prepareRepo(client, c.req.valid('json').directory);
      if (repo.error) return c.json({ message: repo.error.message }, repo.error.status);
      const result = await pullBranch(repo.data);
      return result.error ? c.json({ message: result.error.message }, 400) : c.json(result.data, 200);
    });
};
