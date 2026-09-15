import type { EventPermissionAsked, EventSessionError, EventSessionIdle, GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { setTimeout } from 'node:timers/promises';
import { forwardToRelay } from './forward.ts';
import { getLastAssistantText, trim, type OpencodeMessage } from './helpers.ts';
import { createSmartNotification, IDLE_DELAY_MS } from './smart.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';
import { opencodeError } from '../compiled/whatcode/lib/opencode/error.ts';
import { getProjectName } from '../compiled/whatcode/lib/project.ts';
import { logger } from '../logger.ts';

export const startNotifications = (client: OpencodeClient): void => {
  const smart = createSmartNotification();

  const getModelName = async (messages: OpencodeMessage[]) => {
    const lastUser = messages.findLast((m) => m.info.role === 'user');
    if (lastUser?.info.role !== 'user') return { data: 'unknown' };
    const { providerID, modelID } = lastUser.info.model;
    const { data: config, error } = await client.config.providers();
    if (error) return { error: error };
    const provider = config.providers.find((p) => p.id === providerID);
    return { data: provider?.models[modelID]?.name ?? modelID };
  };

  const handleSessionIdle = async ({ sessionID }: EventSessionIdle['properties']): Promise<void> => {
    const loggerName = 'notifications:session.idle';
    logger.debug(loggerName, `session.idle event received for session ${sessionID}`);
    // Delay slightly so a concurrent session.error handler has time to set the lock before we check it.
    await setTimeout(IDLE_DELAY_MS);
    logger.debug(loggerName, `skipping session.idle for session ${sessionID}, error notification already sent`);
    if (smart.isLocked(sessionID)) {
      logger.debug(loggerName, `skipping session.idle for session ${sessionID}, error notification already sent`);
      return;
    }
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) {
      logger.error(loggerName, opencodeError(error).message);
      return;
    }
    if (session.parentID) {
      logger.debug(loggerName, `skipping session.idle for subagent session ${sessionID}`);
      return;
    }
    const messagesResult = await client.session.messages({ sessionID });
    if (messagesResult.error) {
      logger.error(loggerName, opencodeError(messagesResult.error).message);
      return;
    }
    const title = getProjectName(session.directory);
    const modelNameResult = await getModelName(messagesResult.data);
    if (modelNameResult.error) {
      logger.error(loggerName, modelNameResult.error.data.message);
      return;
    }
    const lastText = getLastAssistantText(messagesResult.data);
    const body = lastText ? trim(`${modelNameResult.data}: ${lastText}`) : modelNameResult.data;
    logger.debug('notifications', `forwarding session.idle: title=${title}, body=${body}`);
    const result = await forwardToRelay({
      title,
      body,
      event: 'session.idle',
      sessionID,
      projectID: session.projectID,
      directory: session.directory,
    });
  };

  const handlePermissionAsked = async ({ sessionID, permission, patterns }: EventPermissionAsked['properties']): Promise<void> => {
    const loggerName = 'notifications:permission.asked';
    logger.debug(loggerName, `permission.asked event received for session ${sessionID}, permission=${permission}`);
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) {
      logger.error(loggerName, opencodeError(error).message);
      return;
    }
    if (session.parentID) {
      logger.debug(loggerName, `skipping permission.asked for subagent session ${sessionID}`);
      return;
    }
    const title = getProjectName(session.directory);
    const messagesResult = await client.session.messages({ sessionID });
    if (messagesResult.error) {
      logger.error(loggerName, opencodeError(messagesResult.error).message);
      return;
    }
    const modelNameResult = await getModelName(messagesResult.data);
    if (modelNameResult.error) {
      logger.error(loggerName, modelNameResult.error.data.message);
      return;
    }
    const target = patterns[0] ?? permission;
    logger.debug('notifications', `forwarding permission.asked: title=${title}, target=${target}`);
    const result = await forwardToRelay({
      title,
      body: trim(`${modelNameResult.data} needs permission to: ${target}`),
      event: 'permission.asked',
      sessionID,
      projectID: session.projectID,
      directory: session.directory,
    });
  };

  const handleSessionError = async ({ sessionID, error }: EventSessionError['properties']): Promise<void> => {
    const loggerName = 'notifications:session.error';
    logger.debug(loggerName, `session.error event received for session ${sessionID ?? 'unknown'}`);
    if (!sessionID) {
      logger.debug('notifications', 'skipping session.error — no session available');
      return;
    }
    smart.lock(sessionID);
    const sessionResult = await client.session.get({ sessionID });
    if (sessionResult.error) {
      logger.error(loggerName, opencodeError(sessionResult.error).message);
      return;
    }
    if (sessionResult.data.parentID) {
      smart.unlock(sessionID);
      logger.debug('notifications', `skipping session.error for subagent session ${sessionResult.data.id}`);
      return;
    }
    const title = getProjectName(sessionResult.data.directory);
    const body = trim(typeof error?.data.message === 'string' ? error.data.message : 'An unexpected error occurred');
    logger.debug('notifications', `forwarding session.error: title=${title}, body=${body}`);
    const result = await forwardToRelay({
      title,
      body,
      event: 'session.error',
      sessionID,
      projectID: sessionResult.data.projectID,
      directory: sessionResult.data.directory,
    });
  };

  registerEventHandler(async (event: GlobalEvent): Promise<void> => {
    switch (event.payload.type) {
      case 'session.idle': {
        await handleSessionIdle(event.payload.properties);
        break;
      }
      case 'permission.asked': {
        await handlePermissionAsked(event.payload.properties);
        break;
      }
      case 'session.error': {
        await handleSessionError(event.payload.properties);
        break;
      }
    }
  });

  logger.debug('notifications', 'listening for events');
};
