// eslint-disable-next-line no-restricted-imports
import { Router } from 'express';
import * as z from 'zod';
import { identityStore } from '../stores/identity.ts';

const renameBodySchema = z.strictObject({ name: z.string().trim().min(1) });

export const identityRouter = Router();

identityRouter.get('/', (_req, res) => {
  res.status(200).json({ data: identityStore.get() });
});

identityRouter.patch('/name', (req, res) => {
  const result = renameBodySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Name must be a non-empty string' });
    return;
  }
  const current = identityStore.get();
  if (current === undefined) {
    res.status(503).json({ error: 'Account not found!' });
    return;
  }
  identityStore.set({ ...current, name: result.data.name });
  res.status(200).json({ data: identityStore.get() });
});
