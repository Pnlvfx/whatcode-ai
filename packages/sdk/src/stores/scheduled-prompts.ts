import type { StoreOpResult } from '../compiled/store/store2.ts';
import * as z from 'zod/v4/mini';
import { WHATCODE_ROOT } from '../config/constants.ts';
import { createStore2 } from '../compiled/store/store2.ts';
import { logger } from '../logger.ts';

const scheduledPromptSchema = z.strictObject({
  id: z.string(),
  sessionId: z.string(),
  text: z.string(),
  agent: z.optional(z.string()),
  runAt: z.number(),
  status: z.literal(['pending', 'failed', 'missed']),
  error: z.optional(z.string()),
});

const scheduledPromptsStore = createStore2('scheduled-prompts', z.array(scheduledPromptSchema), { directory: WHATCODE_ROOT, initial: [] });

const validationResult = await scheduledPromptsStore.validate();
if (validationResult.error) {
  logger.warn('scheduled-prompts', 'Scheduled prompts schema changed, resetting...');
  await scheduledPromptsStore.clear();
}

export const getScheduledPrompts = scheduledPromptsStore.get;

export const addScheduledPrompt = (prompt: ScheduledPrompt) => scheduledPromptsStore.set((prev) => [...prev, prompt]);

export const removeScheduledPrompt = (id: string) => scheduledPromptsStore.set((prev) => prev.filter((prompt) => prompt.id !== id));

export const findScheduledPrompt = async (id: string): Promise<StoreOpResult<ScheduledPrompt | undefined>> => {
  const { data, error } = await scheduledPromptsStore.get();
  return error ? { error } : { data: data.find((prompt) => prompt.id === id) };
};

export const listSessionScheduledPrompts = async (sessionId: string): Promise<StoreOpResult<ScheduledPrompt[]>> => {
  const { data, error } = await scheduledPromptsStore.get();
  return error ? { error } : { data: data.filter((prompt) => prompt.sessionId === sessionId) };
};

// an outcome replaces the stored row, undefined removes it, rows cancelled in the meantime are not brought back
export const applyScheduledOutcomes = (outcomes: ReadonlyMap<string, ScheduledPrompt | undefined>) =>
  scheduledPromptsStore.set((prev) =>
    prev.flatMap((prompt) => {
      if (!outcomes.has(prompt.id)) return [prompt];
      const next = outcomes.get(prompt.id);
      return next === undefined ? [] : [next];
    }),
  );

export type ScheduledPrompt = z.infer<typeof scheduledPromptSchema>;
