import * as z from 'zod/v4/mini';
import { WHATCODE_AUTH } from '../config/constants.ts';
import { createStore2 } from '../compiled/store/store2.ts';

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

export type SessionState = z.infer<typeof sessionStateSchema>;

const notificationStateSchema = z.record(z.string(), sessionStateSchema);

const notificationStateStore = createStore2('notification-state', notificationStateSchema, {
  directory: WHATCODE_AUTH,
  initial: {},
});

export const getNotificationState = async () => {
  const { error, data } = await notificationStateStore.get();
  if (error) {
    await notificationStateStore.clear();
  }

  return data ?? {};
};

export const updateNotificationState = async (
  sessionID: string,
  updater: (prev: SessionState) => SessionState,
  fallback: Omit<SessionState, 'unseenCount' | 'unseenMessages' | 'lastEventAt'>,
): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID] ?? { ...fallback, unseenCount: 0, unseenMessages: 0, lastEventAt: Date.now() };
    return { ...prev, [sessionID]: updater(existing) };
  });
};

export const clearPendingPermission = async (sessionID: string): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    if (!existing) return prev;
    return { ...prev, [sessionID]: { ...existing, hasPendingPermission: false, lastEventAt: Date.now() } };
  });
};

export const incrementUnseenMessages = async (sessionID: string): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    if (!existing) return prev;
    return { ...prev, [sessionID]: { ...existing, unseenMessages: existing.unseenMessages + 1, lastEventAt: Date.now() } };
  });
};

export const markSessionSeen = async (sessionID: string): Promise<void> => {
  await notificationStateStore.set((prev) => {
    const existing = prev[sessionID];
    if (!existing) return prev;
    return { ...prev, [sessionID]: { ...existing, unseenCount: 0, unseenMessages: 0 } };
  });
};

export const resetNotificationState = notificationStateStore.clear;
