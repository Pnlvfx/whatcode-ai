import type { GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import type { SessionState } from '../stores/notification-state.ts';
import { getNotificationState, updateNotificationState, clearPendingPermission, incrementUnseenMessages } from '../stores/notification-state.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';
import { getLastAssistantText, getLastUserModel } from '../apn/helpers.ts';
import { opencodeError } from '../compiled/whatcode/lib/opencode/error.ts';
import { logger } from '../logger.ts';
import { activeSessionTracker } from './active.ts';

type SessionMeta = Pick<SessionState, 'projectID' | 'directory'>;

export const startNotificationTracker = (client: OpencodeClient) => {
  const getOrFetchSession = async (sessionID: string): Promise<SessionMeta | undefined> => {
    const current = await getNotificationState();
    const existing = current[sessionID];
    if (existing) return { projectID: existing.projectID, directory: existing.directory };
    const { data, error } = await client.session.get({ sessionID });
    if (error) throw opencodeError(error);
    if (data.parentID !== undefined) return undefined;
    return { projectID: data.projectID, directory: data.directory };
  };

  const handleSessionStatus = async (sessionID: string): Promise<void> => {
    const meta = await getOrFetchSession(sessionID);
    if (!meta) return;
    await updateNotificationState(sessionID, (prev) => ({ ...prev, isBusy: true, hasError: false, lastEventAt: Date.now() }), {
      sessionID,
      ...meta,
      isBusy: true,
      hasPendingPermission: false,
      hasError: false,
    });
  };

  const handleSessionIdle = async (sessionID: string): Promise<void> => {
    const meta = await getOrFetchSession(sessionID);
    if (!meta) return;
    const shouldCount = sessionID !== activeSessionTracker.getActiveSession();
    const { data: messagesData, error: messagesError } = await client.session.messages({ sessionID });
    const lastAssistantText = messagesError ? undefined : getLastAssistantText(messagesData);
    const lastModel = messagesError ? undefined : getLastUserModel(messagesData);
    await updateNotificationState(
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
      { sessionID, ...meta, isBusy: false, hasPendingPermission: false, hasError: false },
    );
  };

  const handleSessionError = async (sessionID: string, errorMessage: string | undefined): Promise<void> => {
    const meta = await getOrFetchSession(sessionID);
    if (!meta) return;
    const lastErrorText = typeof errorMessage === 'string' ? errorMessage : 'An unexpected error occurred';
    await updateNotificationState(
      sessionID,
      (prev) => ({ ...prev, isBusy: false, hasError: true, lastErrorText, lastAssistantText: undefined, lastEventAt: Date.now() }),
      { sessionID, ...meta, isBusy: false, hasPendingPermission: false, hasError: true },
    );
  };

  const handlePermissionAsked = async (sessionID: string): Promise<void> => {
    const meta = await getOrFetchSession(sessionID);
    if (!meta) return;
    const shouldCount = sessionID !== activeSessionTracker.getActiveSession();
    await updateNotificationState(
      sessionID,
      (prev) => ({
        ...prev,
        hasPendingPermission: true,
        unseenCount: shouldCount ? prev.unseenCount + 1 : prev.unseenCount,
        lastEventAt: Date.now(),
      }),
      { sessionID, ...meta, isBusy: true, hasPendingPermission: true, hasError: false },
    );
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
        if (msg.role !== 'assistant' || msg.time.completed === undefined || msg.sessionID === activeSessionTracker.getActiveSession()) return;
        await incrementUnseenMessages(msg.sessionID);
        break;
      }
      default: {
        break;
      }
    }
  };

  registerEventHandler(handleEvent);
  logger.debug('notification-tracker', 'started');
};
