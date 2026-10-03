import type { V2Event } from '@opencode/client';
import type { WhatCodeClient } from './client.ts';
import { setTimeout } from 'node:timers/promises';
import { logger } from '../logger.ts';

type EventHandler = (event: V2Event) => Promise<void> | void;

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

export const startEventSubscription = (client: WhatCodeClient): void => {
  const subscribe = async (): Promise<void> => {
    let delay = BACKOFF_INITIAL_MS;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      try {
        const events = client.event.subscribe();

        for await (const event of events) {
          for (const handler of handlers) {
            // eslint-disable-next-line parallelize/no-sequential-await -- handlers must run sequentially: each processes the same event in registration order to avoid concurrent state mutations
            await handler(event);
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
