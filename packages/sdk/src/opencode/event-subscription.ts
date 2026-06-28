import type { GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { setTimeout } from 'node:timers/promises';
import { logger } from '../compiled/node/logger.ts';

type EventHandler = (event: GlobalEvent) => Promise<void> | void;

const BACKOFF_INITIAL_MS = 1000;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

const handlers = new Set<EventHandler>();

export const registerEventHandler = (handler: EventHandler): (() => void) => {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
};

export const startEventSubscription = (client: OpencodeClient): void => {
  const subscribe = async (): Promise<void> => {
    let delay = BACKOFF_INITIAL_MS;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      try {
        const events = await client.global.event();

        for await (const event of events.stream) {
          for (const handler of handlers) {
            try {
              await handler(event);
            } catch (err) {
              logger.error('event-subscription', 'handler error', err);
            }
          }
        }

        delay = BACKOFF_INITIAL_MS;
        logger.debug('event-subscription', 'stream ended, reconnecting...');
      } catch (err) {
        logger.error('event-subscription', `stream error, retrying in ${(delay / 1000).toString()}s...`, err);
        await setTimeout(delay);
        delay = Math.min(delay * BACKOFF_MULTIPLIER, BACKOFF_MAX_MS);
      }
    }
  };

  void subscribe();

  logger.debug('event-subscription', 'started');
};
