import type { EventPermissionAsked, EventSessionError, EventSessionIdle, GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { forwardToRelay } from './forward.ts';
import { getLastAssistantText, getProjectName, trim, type OpencodeMessage } from './helpers.ts';
import { logger } from '../compiled/node/logger.ts';
import { createSmartNotification } from './smart.ts';
import { opencodeError } from '../opencode/error.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';

export const startNotifications = (client: OpencodeClient): void => {
  const smart = createSmartNotification();

  const getMessages = async (sessionID: string) => {
    const { data, error } = await client.session.messages({ sessionID });
    if (error) throw opencodeError(error);
    return data;
  };

  const getModelName = async (messages: OpencodeMessage[]): Promise<string> => {
    const lastUser = messages.findLast((m) => m.info.role === 'user');
    if (lastUser?.info.role !== 'user') return 'unknown';
    const { providerID, modelID } = lastUser.info.model;
    const { data: config, error } = await client.config.providers();
    if (error) throw opencodeError(error);
    const provider = config.providers.find((p) => p.id === providerID);
    return provider?.models[modelID]?.name ?? modelID;
  };

  const handleSessionIdle = async ({ sessionID }: EventSessionIdle['properties']): Promise<void> => {
    logger.debug('notifications', `session.idle event received for session ${sessionID}`);
    if (smart.unlock(sessionID)) {
      logger.debug('notifications', `skipping session.idle for session ${sessionID}, error notification already sent`);
    } else {
      const { data: session, error } = await client.session.get({ sessionID });
      if (error) throw opencodeError(error);
      if (session.parentID) {
        logger.debug('notifications', `skipping session.idle for subagent session ${sessionID}`);
      } else {
        const title = getProjectName(session.directory);
        const messages = await getMessages(sessionID);
        const modelName = await getModelName(messages);
        const lastText = getLastAssistantText(messages);
        const body = lastText ? trim(`${modelName}: ${lastText}`) : modelName;
        logger.debug('notifications', `forwarding session.idle: title=${title}, body=${body}`);
        await forwardToRelay({ title, body, event: 'session.idle', sessionID, projectID: session.projectID, directory: session.directory });
      }
    }
  };

  const handlePermissionAsked = async ({ sessionID, permission, patterns }: EventPermissionAsked['properties']): Promise<void> => {
    logger.debug('notifications', `permission.asked event received for session ${sessionID}, permission=${permission}`);
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) throw opencodeError(error);
    if (session.parentID) {
      logger.debug('notifications', `skipping permission.asked for subagent session ${sessionID}`);
    } else {
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
    }
  };

  const handleSessionError = async ({ sessionID, error }: EventSessionError['properties']): Promise<void> => {
    logger.debug('notifications', `session.error event received for session ${sessionID ?? 'unknown'}`);
    if (sessionID) {
      smart.lock(sessionID);
      const { data: session, error: sessionError } = await client.session.get({ sessionID });
      if (sessionError) throw opencodeError(sessionError);
      if (session.parentID) {
        smart.unlock(sessionID);
        logger.debug('notifications', `skipping session.error for subagent session ${session.id}`);
      } else {
        const title = getProjectName(session.directory);
        const body = trim(typeof error?.data.message === 'string' ? error.data.message : 'An unexpected error occurred');
        logger.debug('notifications', `forwarding session.error: title=${title}, body=${body}`);
        await forwardToRelay({ title, body, event: 'session.error', sessionID, projectID: session.projectID, directory: session.directory });
      }
    } else {
      logger.debug('notifications', 'skipping session.error — no session available');
    }
  };

  registerEventHandler(async (event: GlobalEvent): Promise<void> => {
    switch (event.payload.type) {
      case 'session.idle':
        await handleSessionIdle(event.payload.properties);
        break;
      case 'permission.asked':
        await handlePermissionAsked(event.payload.properties);
        break;
      case 'session.error':
        await handleSessionError(event.payload.properties);
        break;
    }
  });

  logger.debug('notifications', 'listening for events');
};
