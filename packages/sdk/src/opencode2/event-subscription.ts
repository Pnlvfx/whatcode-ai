import type { EventSubscribeOutput } from '@opencode-ai/client';
import { setTimeout } from 'node:timers/promises';
import type { OpencodeV2Client } from './opencode2.ts';
import { logger } from '../logger.ts';

export type V2EventHandler = (event: EventSubscribeOutput) => Promise<void> | void;

const BACKOFF_INITIAL_MS = 1000;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

const handlers = new Set<V2EventHandler>();

export const registerV2EventHandler = (handler: V2EventHandler): (() => void) => {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
};

export const startV2EventSubscription = (client: OpencodeV2Client): void => {
  const subscribe = async (): Promise<void> => {
    let delay = BACKOFF_INITIAL_MS;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      try {
        for await (const event of client.event.subscribe()) {
          for (const handler of handlers) {
            try {
              await handler(event);
            } catch (err) {
              logger.error('event-subscription-v2', 'handler error', err);
            }
          }
        }

        delay = BACKOFF_INITIAL_MS;
        logger.debug('event-subscription-v2', 'stream ended, reconnecting...');
      } catch (err) {
        logger.error('event-subscription-v2', `stream error, retrying in ${(delay / 1000).toString()}s...`, err);
        await setTimeout(delay);
        delay = Math.min(delay * BACKOFF_MULTIPLIER, BACKOFF_MAX_MS);
      }
    }
  };

  void subscribe();

  logger.debug('event-subscription-v2', 'started');
};
