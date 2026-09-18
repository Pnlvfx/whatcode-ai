import * as z from 'zod/v4/mini';
import { WHATCODE_ROOT } from '../config/constants.ts';
import { createStore2 } from '../compiled/store/store2.ts';
import { logger } from '../logger.ts';

const sessionStateSchema = z.strictObject({
  sessionID: z.string(),
  projectID: z.string(),
  directory: z.string(),
  isBusy: z.boolean(),
  hasPendingPermission: z.boolean(),
  hasError: z.boolean(),
  unseenCount: z.number(),
  unseenMessages: z.number(),
  lastEventAt: z.number(),
  lastAssistantText: z.optional(z.string()),
  lastErrorText: z.optional(z.string()),
  lastModel: z.optional(z.string()),
});

const notificationStateSchema = z.record(z.string(), sessionStateSchema);

const notificationStateStore = createStore2('notification-state', notificationStateSchema, {
  directory: WHATCODE_ROOT,
  initial: {},
});

const validationResult = await notificationStateStore.validate();
if (validationResult.error) {
  logger.warn('notification', 'Notification schema changed, resetting...');
  await notificationStateStore.clear();
}

export const getNotificationState = notificationStateStore.get;
export const resetNotificationState = notificationStateStore.clear;

export const updateNotificationState = async (
  sessionID: string,
  updater: (prev: SessionState) => SessionState,
  fallback: Omit<SessionState, 'unseenCount' | 'unseenMessages' | 'lastEventAt'>,
) => {
  return notificationStateStore.set((prev) => {
    const existing = prev[sessionID] ?? { ...fallback, unseenCount: 0, unseenMessages: 0, lastEventAt: Date.now() };
    return { ...prev, [sessionID]: updater(existing) };
  });
};

export const clearPendingPermission = async (sessionID: string) => {
  return notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    return existing ? { ...prev, [sessionID]: { ...existing, hasPendingPermission: false, lastEventAt: Date.now() } } : prev;
  });
};

export const incrementUnseenMessages = async (sessionID: string) => {
  return notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    return existing ? { ...prev, [sessionID]: { ...existing, unseenMessages: existing.unseenMessages + 1, lastEventAt: Date.now() } } : prev;
  });
};

export const markSessionSeen = async (sessionID: string) => {
  return notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    return existing ? { ...prev, [sessionID]: { ...existing, unseenCount: 0, unseenMessages: 0 } } : prev;
  });
};

export type SessionState = z.infer<typeof sessionStateSchema>;
