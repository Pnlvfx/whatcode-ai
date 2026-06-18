import type { GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { setTimeout } from 'node:timers/promises';
import { forwardToRelay } from './forward.ts';
import { getLastAssistantText, getProjectName, trim, type OpencodeMessage } from './helpers.ts';
import { logger } from '../compiled/node/logger.ts';

const BACKOFF_INITIAL_MS = 1000;
const BACKOFF_MAX_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

export const startNotifications = (client: OpencodeClient): void => {
  const getMessages = async (sessionID: string) => {
    const { data } = await client.session.messages<true>({ sessionID });
    return data;
  };

  const getModelName = async (messages: OpencodeMessage[]): Promise<string> => {
    const lastUser = messages.findLast((m) => m.info.role === 'user');
    if (lastUser?.info.role !== 'user') return 'unknown';
    const { providerID, modelID } = lastUser.info.model;
    const { data: config } = await client.config.providers<true>();
    const provider = config.providers.find((p) => p.id === providerID);
    return provider?.models[modelID]?.name ?? modelID;
  };

  const processEventStream = async (event: GlobalEvent): Promise<void> => {
    switch (event.payload.type) {
      case 'session.idle': {
        const { sessionID } = event.payload.properties;
        logger.debug('notifications', `session.idle event received for session ${sessionID}`);
        const { data: session } = await client.session.get<true>({ sessionID });
        if (session.parentID) {
          logger.debug('notifications', `skipping session.idle for subagent session ${sessionID}`);
          break;
        }
        const title = getProjectName(session.directory);
        const messages = await getMessages(sessionID);
        const modelName = await getModelName(messages);
        const lastText = getLastAssistantText(messages);
        const body = lastText ? trim(`${modelName}: ${lastText}`) : modelName;
        logger.debug('notifications', `forwarding session.idle: title=${title}, body=${body}`);
        await forwardToRelay({ title, body, event: 'session.idle', sessionID, projectID: session.projectID, directory: session.directory });
        break;
      }
      case 'permission.asked': {
        const { sessionID, permission, patterns } = event.payload.properties;
        logger.debug('notifications', `permission.asked event received for session ${sessionID}, permission=${permission}`);
        const { data: session } = await client.session.get<true>({ sessionID });
        if (session.parentID) {
          logger.debug('notifications', `skipping permission.asked for subagent session ${sessionID}`);
          break;
        }
        const title = getProjectName(session.directory);
        const messages = await getMessages(sessionID);
        const modelName = await getModelName(messages);
        const target = patterns[0] ?? permission;
        logger.debug('notifications', `forwarding permission.asked: title=${title}, target=${target}`);
        await forwardToRelay({
          title,
          body: trim(`${modelName} needs permission to: ${target}`),
          event: 'permission.asked',
          sessionID,
          projectID: session.projectID,
          directory: session.directory,
        });
        break;
      }
      case 'session.error': {
        const { sessionID, error } = event.payload.properties;
        logger.debug('notifications', `session.error event received for session ${sessionID ?? 'unknown'}`);
        let session;
        if (sessionID) {
          ({ data: session } = await client.session.get<true>({ sessionID }));
        }
        if (session?.parentID) {
          logger.debug('notifications', `skipping session.error for subagent session ${session.id}`);
          break;
        }
        if (!session || !sessionID) {
          logger.debug('notifications', 'skipping session.error — no session available');
          break;
        }
        const title = getProjectName(session.directory);
        const body = trim(typeof error?.data.message === 'string' ? error.data.message : 'An unexpected error occurred');
        logger.debug('notifications', `forwarding session.error: title=${title}, body=${body}`);
        await forwardToRelay({ title, body, event: 'session.error', sessionID, projectID: session.projectID, directory: session.directory });
        break;
      }
    }
  };

  const subscribeToEvents = async (): Promise<void> => {
    let delay = BACKOFF_INITIAL_MS;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      try {
        const events = await client.global.event<true>();

        for await (const event of events.stream) {
          await processEventStream(event);
        }

        delay = BACKOFF_INITIAL_MS;
        logger.debug('notifications', 'stream ended, reconnecting...');
      } catch (err) {
        logger.error('notifications', `stream error, retrying in ${(delay / 1000).toString()}s...`, err);
        await setTimeout(delay);
        delay = Math.min(delay * BACKOFF_MULTIPLIER, BACKOFF_MAX_MS);
      }
    }
  };

  void subscribeToEvents();

  logger.debug('notifications', 'listening for events');
};
