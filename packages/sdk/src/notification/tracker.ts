import type { GlobalEvent, OpencodeClient } from '@opencode-ai/sdk/v2';
import { notificationStateStore, type SessionState } from '../stores/notification-state.ts';
import { registerEventHandler } from '../opencode/event-subscription.ts';
import { opencodeError } from '../opencode/error.ts';
import { logger } from '../compiled/node/logger.ts';

let activeSessionID: string | undefined;

export const setActiveSession = (sessionID: string | undefined): void => {
  activeSessionID = sessionID;
};

const getOrFetchSession = async (
  client: OpencodeClient,
  sessionID: string,
  current: Record<string, SessionState>,
): Promise<Pick<SessionState, 'projectID' | 'directory'>> => {
  const existing = current[sessionID];
  if (existing) return { projectID: existing.projectID, directory: existing.directory };
  const { data, error } = await client.session.get({ sessionID });
  if (error) throw opencodeError(error);
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

export const startNotificationTracker = (client: OpencodeClient): void => {
  const handleEvent = async (event: GlobalEvent): Promise<void> => {
    const payload = event.payload;

    switch (payload.type) {
      case 'session.status': {
        if (payload.properties.status.type !== 'busy' && payload.properties.status.type !== 'retry') return;
        const sessionID = payload.properties.sessionID;
        const current = await notificationStateStore.get();
        const meta = await getOrFetchSession(client, sessionID, current);
        await mutate(
          sessionID,
          (prev) => ({ ...prev, isBusy: true, hasError: false, lastEventAt: Date.now() }),
          { sessionID, ...meta, isBusy: true, hasPendingPermission: false, hasError: false },
        );
        break;
      }

      case 'session.idle': {
        const sessionID = payload.properties.sessionID;
        const current = await notificationStateStore.get();
        const meta = await getOrFetchSession(client, sessionID, current);
        const isActive = sessionID === activeSessionID;
        await mutate(
          sessionID,
          (prev) => ({
            ...prev,
            isBusy: false,
            hasPendingPermission: false,
            unseenCount: isActive ? prev.unseenCount : prev.unseenCount + 1,
            lastEventAt: Date.now(),
          }),
          { sessionID, ...meta, isBusy: false, hasPendingPermission: false, hasError: false },
        );
        break;
      }

      case 'session.error': {
        const sessionID = payload.properties.sessionID;
        if (!sessionID) return;
        const current = await notificationStateStore.get();
        const meta = await getOrFetchSession(client, sessionID, current);
        await mutate(
          sessionID,
          (prev) => ({ ...prev, isBusy: false, hasError: true, lastEventAt: Date.now() }),
          { sessionID, ...meta, isBusy: false, hasPendingPermission: false, hasError: true },
        );
        break;
      }

      case 'permission.asked': {
        const sessionID = payload.properties.sessionID;
        const current = await notificationStateStore.get();
        const meta = await getOrFetchSession(client, sessionID, current);
        const isActive = sessionID === activeSessionID;
        await mutate(
          sessionID,
          (prev) => ({
            ...prev,
            hasPendingPermission: true,
            unseenCount: isActive ? prev.unseenCount : prev.unseenCount + 1,
            lastEventAt: Date.now(),
          }),
          { sessionID, ...meta, isBusy: true, hasPendingPermission: true, hasError: false },
        );
        break;
      }

      case 'permission.replied': {
        const sessionID = payload.properties.sessionID;
        await notificationStateStore.set((prev) => {
          const existing = prev[sessionID];
          if (!existing) return prev;
          return { ...prev, [sessionID]: { ...existing, hasPendingPermission: false, lastEventAt: Date.now() } };
        });
        break;
      }

      case 'message.updated': {
        const msg = payload.properties.info;
        if (msg.role !== 'assistant' || msg.time.completed === undefined) return;
        const sessionID = msg.sessionID;
        const isActive = sessionID === activeSessionID;
        if (isActive) return;
        await notificationStateStore.set((prev) => {
          const existing = prev[sessionID];
          if (!existing) return prev;
          return { ...prev, [sessionID]: { ...existing, unseenMessages: existing.unseenMessages + 1, lastEventAt: Date.now() } };
        });
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
