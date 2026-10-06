import type { SessionMessageAssistant, V2Event, PermissionAsked, SessionExecutionFailed } from '@opencode/client';
import type { WhatCodeClient } from '../opencode/client.ts';
import { forwardToRelay } from './forward.ts';
import { trim } from './helpers.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';
import { getProjectName } from '../compiled/whatcode/lib/project.ts';
import { logger } from '../logger.ts';

export const startNotifications = (client: WhatCodeClient): void => {
  const getModel = async (assistantMessage: SessionMessageAssistant) => {
    const id = assistantMessage.model.id;
    const result = await client.model.list();
    if (result.error) {
      logger.debug('notification:model', result.error.message);
      return;
    }
    return result.data.data.find((m) => m.id === id);
  };

  const handleSessionSucceeded = async (sessionID: string): Promise<void> => {
    const loggerName = 'notifications:session.execution.succeeded';
    logger.debug(loggerName, `session.execution.succeeded event received for session ${sessionID}`);
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) {
      logger.error(loggerName, error.message);
      return;
    }
    if (session.parentID) {
      logger.debug(loggerName, `skipping session.execution.succeeded for subagent session ${sessionID}`);
      return;
    }
    const messagesResult = await client.message.list({ sessionID, order: 'desc', type: 'assistant', limit: 1 });
    if (messagesResult.error) {
      logger.error(loggerName, messagesResult.error.message);
      return;
    }
    const messages = messagesResult.data.data;
    const title = getProjectName(session.location.directory);
    const assistantMessages = messages.filter((m) => m.type === 'assistant');
    const last = assistantMessages.at(-1);
    const model = last ? await getModel(last) : undefined;
    const text = last?.content.findLast((c) => c.type === 'text')?.text;
    const body = trim(`${model?.name ?? 'Agent'}: ${text ?? 'Done'}`);
    logger.debug('notifications', `forwarding session.execution.succeeded: title=${title}`);
    const forwardResult = await forwardToRelay({
      title,
      body,
      event: 'session.idle',
      sessionID,
      projectID: session.projectID,
      directory: session.location.directory,
    });
    if (forwardResult.error) {
      logger.error(loggerName, forwardResult.error.message);
    }
  };

  const handlePermissionAsked = async ({ sessionID, action, resources }: PermissionAsked['data']): Promise<void> => {
    const loggerName = 'notifications:permission.asked';
    logger.debug(loggerName, `permission.asked event received for session ${sessionID}, action=${action}`);
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) {
      logger.error(loggerName, error.message);
      return;
    }
    if (session.parentID) {
      logger.debug(loggerName, `skipping permission.asked for subagent session ${sessionID}`);
      return;
    }

    const messagesResult = await client.message.list({ sessionID });
    if (messagesResult.error) {
      logger.error(loggerName, messagesResult.error.message);
      return;
    }
    const messages = messagesResult.data.data;
    const title = getProjectName(session.location.directory);
    const assistantMessages = messages.filter((m) => m.type === 'assistant');
    const last = assistantMessages.at(-1);
    const model = last ? await getModel(last) : undefined;
    const text = `needs permission to ${action} ${resources.join(', ')}`;
    logger.debug('notifications', `forwarding permission.asked: title=${title}`);
    const forwardResult = await forwardToRelay({
      title,
      body: trim(`${model?.name ?? 'Agent'} ${text}`),
      event: 'permission.asked',
      sessionID,
      projectID: session.projectID,
      directory: session.location.directory,
    });
    if (forwardResult.error) {
      logger.error(loggerName, forwardResult.error.message);
    }
  };

  const handleSessionError = async ({ sessionID, error }: SessionExecutionFailed['data']): Promise<void> => {
    const loggerName = 'notifications:session.error';
    logger.debug(loggerName, `session.error event received for session ${sessionID}`);
    if (!sessionID) {
      logger.debug('notifications', 'skipping session.error — no session available');
      return;
    }
    const sessionResult = await client.session.get({ sessionID });
    if (sessionResult.error) {
      logger.error(loggerName, sessionResult.error.message);
      return;
    }
    if (sessionResult.data.parentID) {
      logger.debug('notifications', `skipping session.error for subagent session ${sessionResult.data.id}`);
      return;
    }
    const title = getProjectName(sessionResult.data.location.directory);
    const body = trim(error.message);
    logger.debug('notifications', `forwarding session.error: title=${title}`);
    const forwardResult = await forwardToRelay({
      title,
      body,
      event: 'session.error',
      sessionID,
      projectID: sessionResult.data.projectID,
      directory: sessionResult.data.location.directory,
    });
    if (forwardResult.error) {
      logger.error(loggerName, forwardResult.error.message);
    }
  };

  registerEventHandler(async (event: V2Event): Promise<void> => {
    switch (event.type) {
      case 'session.execution.succeeded': {
        await handleSessionSucceeded(event.data.sessionID);
        break;
      }
      case 'permission.asked': {
        await handlePermissionAsked(event.data);
        break;
      }
      case 'session.execution.failed': {
        await handleSessionError(event.data);
        break;
      }
    }
  });

  logger.debug('notifications', 'listening for events');
};
