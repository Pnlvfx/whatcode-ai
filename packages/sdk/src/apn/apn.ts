import type { SessionMessageAssistant, V2Event, PermissionAsked, SessionExecutionFailed, FormCreated } from '@opencode/client';
import type { WhatCodeClient } from '../opencode/client.ts';
import { setTimeout } from 'node:timers/promises';
import { forwardToRelay } from './forward.ts';
import { trim } from './helpers.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';
import { getProjectName } from '../compiled/whatcode/lib/project.ts';
import { logger } from '../logger.ts';

// How long to wait for another client to mark a finished session as viewed before pushing
const VIEWED_GRACE_MS = 4000;

// permission and form requests still waiting for an answer, removed when replied/cancelled or when the grace period ends
const pendingRequests = new Set<string>();

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
      event: 'session.execution.succeeded',
      session_id: sessionID,
      project_id: session.projectID,
      worktree: session.location.directory,
    });
    if (forwardResult.error) {
      logger.error(loggerName, forwardResult.error.message);
    }
  };

  const forwardBlocked = async (sessionID: string, event: 'permission.asked' | 'form.created', text: string): Promise<void> => {
    const loggerName = `notifications:${event}`;
    logger.debug(loggerName, `${event} event received for session ${sessionID}`);
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) {
      logger.error(loggerName, error.message);
      return;
    }
    if (session.parentID) {
      logger.debug(loggerName, `skipping ${event} for subagent session ${sessionID}`);
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
    logger.debug('notifications', `forwarding ${event}: title=${title}`);
    const forwardResult = await forwardToRelay({
      title,
      body: trim(`${model?.name ?? 'Agent'} ${text}`),
      event,
      session_id: sessionID,
      project_id: session.projectID,
      worktree: session.location.directory,
    });
    if (forwardResult.error) {
      logger.error(loggerName, forwardResult.error.message);
    }
  };

  const handlePermissionAsked = ({ sessionID, action, resources }: PermissionAsked['data']): Promise<void> => {
    return forwardBlocked(sessionID, 'permission.asked', `needs permission to ${action} ${resources.join(', ')}`);
  };

  const handleFormCreated = ({ form }: FormCreated['data']): Promise<void> => {
    return forwardBlocked(form.sessionID, 'form.created', `asks: ${form.title}`);
  };

  const handleSessionError = async ({ sessionID, error }: SessionExecutionFailed['data']): Promise<void> => {
    const loggerName = 'notifications:session.error';
    logger.debug(loggerName, `session.error event received for session ${sessionID}`);
    if (!sessionID) {
      logger.debug('notifications', 'skipping session.error, no session available!');
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
      event: 'session.execution.failed',
      session_id: sessionID,
      project_id: sessionResult.data.projectID,
      worktree: sessionResult.data.location.directory,
    });
    if (forwardResult.error) {
      logger.error(loggerName, forwardResult.error.message);
    }
  };

  const isStillUnread = async (sessionID: string): Promise<boolean> => {
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) {
      logger.error('notifications', error.message);
      return true;
    }
    const { idle, viewed } = session.time;
    return idle !== undefined && (viewed === undefined || idle > viewed);
  };

  const notifyIfStillUnread = async (sessionID: string, notify: () => Promise<void>): Promise<void> => {
    try {
      await setTimeout(VIEWED_GRACE_MS);
      if (await isStillUnread(sessionID)) {
        await notify();
        return;
      }
      logger.debug('notifications', `skipping push for session ${sessionID}, already viewed by another client`);
    } catch (err) {
      logger.error('notifications', `delayed push failed for session ${sessionID}`, err);
    }
  };

  const isViewedSince = async (sessionID: string, created: number): Promise<boolean> => {
    const { data: session, error } = await client.session.get({ sessionID });
    if (error) {
      logger.error('notifications', error.message);
      return false;
    }
    const { viewed } = session.time;
    return viewed !== undefined && viewed >= created;
  };

  const notifyIfStillBlocked = async (
    { requestID, sessionID, created }: { requestID: string; sessionID: string; created: number },
    notify: () => Promise<void>,
  ): Promise<void> => {
    try {
      await setTimeout(VIEWED_GRACE_MS);
      if (!pendingRequests.delete(requestID)) {
        logger.debug('notifications', `skipping push for request ${requestID}, already answered`);
        return;
      }
      if (await isViewedSince(sessionID, created)) {
        logger.debug('notifications', `skipping push for request ${requestID}, session ${sessionID} already viewed by another client`);
        return;
      }
      await notify();
    } catch (err) {
      logger.error('notifications', `delayed push failed for request ${requestID}`, err);
    }
  };

  registerEventHandler((event: V2Event): void => {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (event.type) {
      case 'session.execution.succeeded': {
        const { sessionID } = event.data;
        // not awaited on purpose: the event stream dispatches handlers sequentially and must not wait for the grace period
        void notifyIfStillUnread(sessionID, () => handleSessionSucceeded(sessionID));
        break;
      }
      case 'permission.asked': {
        const { id, sessionID } = event.data;
        pendingRequests.add(id);
        // not awaited on purpose: same reason as the succeeded case
        void notifyIfStillBlocked({ requestID: id, sessionID, created: event.created }, () => handlePermissionAsked(event.data));
        break;
      }
      case 'permission.replied': {
        pendingRequests.delete(event.data.requestID);
        break;
      }
      case 'form.created': {
        const { id, sessionID } = event.data.form;
        pendingRequests.add(id);
        // not awaited on purpose: same reason as the succeeded case
        void notifyIfStillBlocked({ requestID: id, sessionID, created: event.created }, () => handleFormCreated(event.data));
        break;
      }
      case 'form.replied':
      case 'form.cancelled': {
        pendingRequests.delete(event.data.id);
        break;
      }
      case 'session.execution.failed': {
        const failed = event.data;
        // not awaited on purpose: same reason as the succeeded case
        void notifyIfStillUnread(failed.sessionID, () => handleSessionError(failed));
        break;
      }
    }
  });

  logger.debug('notifications', 'listening for events');
};
