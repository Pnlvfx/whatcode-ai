// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import { identityStore } from '../stores/identity.ts';
import os from 'node:os';

export const identityRouter = Router();

identityRouter.get('/', (_req, res) => {
  res.status(200).json({ data: { ...identityStore.get(), name: os.hostname() } });
});
