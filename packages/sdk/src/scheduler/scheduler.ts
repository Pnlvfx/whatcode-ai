import type { WhatCodeClient } from '../opencode/client.ts';
import type { ScheduledPrompt } from '../stores/scheduled-prompts.ts';
import { setTimeout } from 'node:timers/promises';
import { applyScheduledOutcomes, findScheduledPrompt, getScheduledPrompts } from '../stores/scheduled-prompts.ts';
import { notifyScheduledPromptFailed } from '../apn/scheduled.ts';
import { logger } from '../logger.ts';

const TICK_MS = 15_000;
// a prompt is not sent anymore once it is this far past its scheduled time
const LATE_LIMIT_MS = 10 * 60 * 1000;

interface Settled {
  readonly prompt: ScheduledPrompt;
  // undefined means the prompt was delivered and its row can go
  readonly next: ScheduledPrompt | undefined;
}

export const startScheduler = (client: WhatCodeClient): void => {
  void runLoop(client);

  logger.debug('scheduler', 'started');
};

const runLoop = async (client: WhatCodeClient): Promise<void> => {
  for (;;) {
    try {
      await runDue(client);
    } catch (err) {
      logger.error('scheduler', 'tick failed', err);
    }
    await setTimeout(TICK_MS);
  }
};

const runDue = async (client: WhatCodeClient): Promise<void> => {
  const { data, error } = await getScheduledPrompts();
  if (error) {
    logger.error('scheduler', error.message);
    return;
  }

  const now = Date.now();
  const due = data.filter((prompt) => prompt.status === 'pending' && prompt.runAt <= now);
  const results = await Promise.all(due.map((prompt) => settle(client, prompt, now)));
  const settled = results.filter((entry) => entry !== undefined);
  if (settled.length === 0) return;

  const outcome = await applyScheduledOutcomes(new Map(settled.map(({ prompt, next }) => [prompt.id, next])));
  if (outcome.error) {
    logger.error('scheduler', outcome.error.message);
    return;
  }

  const failed = settled.flatMap(({ next }) => (next?.status === 'failed' ? [next] : []));
  await Promise.all(failed.map((prompt) => notifyScheduledPromptFailed(client, prompt)));
};

// resolves with undefined when the prompt must be left alone, for example because it was cancelled
const settle = async (client: WhatCodeClient, prompt: ScheduledPrompt, now: number): Promise<Settled | undefined> => {
  if (now - prompt.runAt > LATE_LIMIT_MS) return { prompt, next: expire(prompt) };

  const current = await findScheduledPrompt(prompt.id);
  if (current.error) {
    logger.error('scheduler', current.error.message);
    return undefined;
  }
  return current.data?.status === 'pending' ? deliver(client, prompt) : undefined;
};

// the prompt id is the opencode message id, so a retry after a crash cannot send the prompt twice
const deliver = async (client: WhatCodeClient, prompt: ScheduledPrompt): Promise<Settled> => {
  const { error } = await client.session.prompt({
    sessionID: prompt.sessionId,
    id: prompt.id,
    text: prompt.text,
    delivery: 'queue',
    ...(prompt.agent !== undefined && { agents: [{ name: prompt.agent }] }),
  });
  if (!error) {
    logger.debug('scheduler', `delivered scheduled prompt ${prompt.id} to session ${prompt.sessionId}`);
    return { prompt, next: undefined };
  }

  logger.error('scheduler', `failed to deliver scheduled prompt ${prompt.id}: ${error.message}`);
  return { prompt, next: { ...prompt, error: error.message } };
};

// a prompt that was never attempted missed its time, one that kept erroring failed
const expire = (prompt: ScheduledPrompt): ScheduledPrompt => {
  return prompt.error === undefined
    ? { ...prompt, status: 'missed', error: 'The daemon was not running at the scheduled time' }
    : { ...prompt, status: 'failed' };
};
