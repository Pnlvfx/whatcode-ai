import type { GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { notificationStateStore, type SessionState } from '../stores/notification-state.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';
import { opencodeError } from '../opencode/error.ts';
import { getLastAssistantText } from '../apn/helpers.ts';
import { logger } from '../compiled/node/logger.ts';

let activeSessionID: string | undefined;

export const setActiveSession = (sessionID: string | undefined): void => {
  activeSessionID = sessionID;
};

type SessionMeta = Pick<SessionState, 'projectID' | 'directory'>;

const getOrFetchSession = async (
  client: OpencodeClient,
  sessionID: string,
  current: Record<string, SessionState>,
): Promise<SessionMeta | undefined> => {
  const existing = current[sessionID];
  if (existing) return { projectID: existing.projectID, directory: existing.directory };
  const { data, error } = await client.session.get({ sessionID });
  if (error) throw opencodeError(error);
  if (data.parentID !== undefined) return undefined;
  return { projectID: data.projectID, directory: data.directory };
};

const mutate = async (
  sessionID: string,
  updater: (prev: SessionState) => SessionState,
  fallback: Omit<SessionState, 'unseenCount' | 'unseenMessages' | 'lastEventAt'>,
): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID] ?? { ...fallback, unseenCount: 0, unseenMessages: 0, lastEventAt: Date.now() };
    return { ...prev, [sessionID]: updater(existing) };
  });
};

const handleSessionStatus = async (client: OpencodeClient, sessionID: string): Promise<void> => {
  const current = await notificationStateStore.get();
  const meta = await getOrFetchSession(client, sessionID, current);
  if (!meta) return;
  await mutate(
    sessionID,
    (prev) => ({ ...prev, isBusy: true, hasError: false, lastEventAt: Date.now() }),
    { sessionID, ...meta, isBusy: true, hasPendingPermission: false, hasError: false },
  );
};

const handleSessionIdle = async (client: OpencodeClient, sessionID: string): Promise<void> => {
  const current = await notificationStateStore.get();
  const meta = await getOrFetchSession(client, sessionID, current);
  if (!meta) return;
  const shouldCount = sessionID !== activeSessionID;
  const { data: messagesData, error: messagesError } = await client.session.messages({ sessionID });
  const lastAssistantText = messagesError ? undefined : getLastAssistantText(messagesData);
  await mutate(
    sessionID,
    (prev) => ({
      ...prev,
      isBusy: false,
      hasPendingPermission: false,
      unseenCount: shouldCount ? prev.unseenCount + 1 : prev.unseenCount,
      lastAssistantText,
      lastErrorText: undefined,
      lastEventAt: Date.now(),
    }),
    { sessionID, ...meta, isBusy: false, hasPendingPermission: false, hasError: false },
  );
};

const handleSessionError = async (client: OpencodeClient, sessionID: string, errorMessage: string | undefined): Promise<void> => {
  const current = await notificationStateStore.get();
  const meta = await getOrFetchSession(client, sessionID, current);
  if (!meta) return;
  const lastErrorText = typeof errorMessage === 'string' ? errorMessage : 'An unexpected error occurred';
  await mutate(
    sessionID,
    (prev) => ({ ...prev, isBusy: false, hasError: true, lastErrorText, lastAssistantText: undefined, lastEventAt: Date.now() }),
    { sessionID, ...meta, isBusy: false, hasPendingPermission: false, hasError: true },
  );
};

const handlePermissionAsked = async (client: OpencodeClient, sessionID: string): Promise<void> => {
  const current = await notificationStateStore.get();
  const meta = await getOrFetchSession(client, sessionID, current);
  if (!meta) return;
  const shouldCount = sessionID !== activeSessionID;
  await mutate(
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

const handlePermissionReplied = async (sessionID: string): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    if (!existing) return prev;
    return { ...prev, [sessionID]: { ...existing, hasPendingPermission: false, lastEventAt: Date.now() } };
  });
};

const handleMessageUpdated = async (sessionID: string): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    if (!existing) return prev;
    return { ...prev, [sessionID]: { ...existing, unseenMessages: existing.unseenMessages + 1, lastEventAt: Date.now() } };
  });
};

export const startNotificationTracker = (client: OpencodeClient): void => {
  const handleEvent = async (event: GlobalEvent): Promise<void> => {
    const payload = event.payload;
    switch (payload.type) {
      case 'session.status':
        if (payload.properties.status.type !== 'busy' && payload.properties.status.type !== 'retry') return;
        await handleSessionStatus(client, payload.properties.sessionID);
        break;
      case 'session.idle':
        await handleSessionIdle(client, payload.properties.sessionID);
        break;
      case 'session.error': {
        if (!payload.properties.sessionID) return;
        const rawMessage = payload.properties.error?.data.message;
        await handleSessionError(client, payload.properties.sessionID, typeof rawMessage === 'string' ? rawMessage : undefined);
        break;
      }
      case 'permission.asked':
        await handlePermissionAsked(client, payload.properties.sessionID);
        break;
      case 'permission.replied':
        await handlePermissionReplied(payload.properties.sessionID);
        break;
      case 'message.updated': {
        const msg = payload.properties.info;
        if (msg.role !== 'assistant' || msg.time.completed === undefined || msg.sessionID === activeSessionID) return;
        await handleMessageUpdated(msg.sessionID);
        break;
      }
      default:
        break;
    }
  };

  registerEventHandler(handleEvent);
  logger.debug('notification-tracker', 'started');
};

export const markSessionViewed = async (sessionID: string): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    if (!existing) return prev;
    return { ...prev, [sessionID]: { ...existing, unseenCount: 0, unseenMessages: 0 } };
  });
};

export const getNotificationState = async (): Promise<Record<string, SessionState>> => {
  return notificationStateStore.get();
};
