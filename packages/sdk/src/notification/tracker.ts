import type { AssistantMessage, GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { getNotificationState, updateNotificationState, clearPendingPermission } from '../stores/notification-state.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';
import { getLastAssistantText, getLastUserModel } from '../apn/helpers.ts';
import { logger } from '../logger.ts';
import { activeSessionTracker } from './active.ts';
import { opencodeError } from '../compiled/whatcode/lib/opencode/error.ts';

export const startNotificationTracker = (client: OpencodeClient) => {
  const getSession = async (sessionID: string) => {
    const currentResult = await getNotificationState();
    if (currentResult.error) return { error: currentResult.error };
    const existing = currentResult.data[sessionID];
    if (existing) return { data: { projectID: existing.projectID, directory: existing.directory } };
    const { data, error } = await client.session.get({ sessionID });
    if (error) return { error };
    if (data.parentID !== undefined) return { data: undefined };
    return { projectID: data.projectID, directory: data.directory };
  };

  const handleSessionStatus = async (sessionID: string) => {
    const sessionResult = await getSession(sessionID);
    if (sessionResult.error) {
      logger.error('session.status', opencodeError(sessionResult.error).message);
    } else if (sessionResult.data) {
      const result = await updateNotificationState(sessionID, (prev) => ({ ...prev, isBusy: true, hasError: false, lastEventAt: Date.now() }), {
        sessionID,
        ...sessionResult.data,
        isBusy: true,
        hasPendingPermission: false,
        hasError: false,
      });
      if (result.error) {
        logger.error('session.status:update', result.error.message);
      }
    }
  };

  const handleSessionIdle = async (sessionID: string): Promise<void> => {
    const sessionResult = await getSession(sessionID);
    if (sessionResult.error) {
      logger.error('session.status', sessionResult.error);
    } else if (sessionResult.data) {
      const shouldCount = sessionID !== activeSessionTracker.getActiveSession();
      const { data: messagesData, error: messagesError } = await client.session.messages({ sessionID });
      const lastAssistantText = messagesError ? undefined : getLastAssistantText(messagesData);
      const lastModel = messagesError ? undefined : getLastUserModel(messagesData);
      const result = await updateNotificationState(
        sessionID,
        (prev) => ({
          ...prev,
          isBusy: false,
          hasPendingPermission: false,
          unseenCount: shouldCount ? prev.unseenCount + 1 : prev.unseenCount,
          lastAssistantText,
          lastModel,
          lastErrorText: undefined,
          lastEventAt: Date.now(),
        }),
        { sessionID, ...sessionResult.data, isBusy: false, hasPendingPermission: false, hasError: false },
      );
    }
  };

  const handleSessionError = async (sessionID: string, errorMessage: string | undefined): Promise<void> => {
    const sessionResult = await getSession(sessionID);
    if (sessionResult.error) {
    } else if (sessionResult.data) {
      const lastErrorText = typeof errorMessage === 'string' ? errorMessage : 'An unexpected error occurred';
      const result = await updateNotificationState(
        sessionID,
        (prev) => ({ ...prev, isBusy: false, hasError: true, lastErrorText, lastAssistantText: undefined, lastEventAt: Date.now() }),
        { sessionID, ...sessionResult.data, isBusy: false, hasPendingPermission: false, hasError: true },
      );
    }
  };

  const handlePermissionAsked = async (sessionID: string): Promise<void> => {
    const sessionResult = await getSession(sessionID);
    if (sessionResult.error) {
    } else if (sessionResult.data) {
      const shouldCount = sessionID !== activeSessionTracker.getActiveSession();
      const result = await updateNotificationState(
        sessionID,
        (prev) => ({
          ...prev,
          hasPendingPermission: true,
          unseenCount: shouldCount ? prev.unseenCount + 1 : prev.unseenCount,
          lastEventAt: Date.now(),
        }),
        { sessionID, ...sessionResult.data, isBusy: true, hasPendingPermission: true, hasError: false },
      );
    }
  };

  const handleEvent = async (event: GlobalEvent): Promise<void> => {
    const payload = event.payload;
    switch (payload.type) {
      case 'session.status': {
        if (payload.properties.status.type !== 'busy' && payload.properties.status.type !== 'retry') return;
        await handleSessionStatus(payload.properties.sessionID);
        break;
      }
      case 'session.idle': {
        await handleSessionIdle(payload.properties.sessionID);
        break;
      }
      case 'session.error': {
        if (!payload.properties.sessionID) return;
        const rawMessage = payload.properties.error?.data.message;
        await handleSessionError(payload.properties.sessionID, typeof rawMessage === 'string' ? rawMessage : undefined);
        break;
      }
      case 'permission.asked': {
        await handlePermissionAsked(payload.properties.sessionID);
        break;
      }
      case 'permission.replied': {
        await clearPendingPermission(payload.properties.sessionID);
        break;
      }
      case 'message.updated': {
        const msg = payload.properties.info;
        if (msg.role !== 'assistant' || msg.time.completed === undefined) return;
        await handleMessageUpdated(msg);
        break;
      }
    }
  };

  registerEventHandler(handleEvent);
  logger.debug('notification-tracker', 'started');
};

const handleMessageUpdated = async (msg: AssistantMessage): Promise<void> => {
  const currentResult = await getNotificationState();
  if (currentResult.error) {
  } else {
    const existing = currentResult.data[msg.sessionID];
    if (!existing) return;
    const isActive = msg.sessionID === activeSessionTracker.getActiveSession();
    const lastModel = `${msg.providerID}/${msg.modelID}`;
    const errorText = extractAssistantErrorText(msg);
    const result = await updateNotificationState(
      msg.sessionID,
      (prev) => ({
        ...prev,
        lastModel,
        ...(errorText !== undefined && { hasError: true, lastErrorText: errorText }),
        ...(!isActive && { unseenMessages: prev.unseenMessages + 1 }),
        lastEventAt: Date.now(),
      }),
      existing,
    );
  }
};

const extractAssistantErrorText = (msg: AssistantMessage): string | undefined => {
  if (!msg.error) return undefined;
  const raw = msg.error.data.message;
  return typeof raw === 'string' ? raw : 'An unexpected error occurred';
};
