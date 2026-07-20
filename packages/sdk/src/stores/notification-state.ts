import * as z from 'zod/v4/mini';
import { WHATCODE_AUTH } from '../config/constants.ts';
import { createStore } from '../compiled/store/store.ts';

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

export const notificationStateStore = await createStore('notification-state', notificationStateSchema, {
  directory: WHATCODE_AUTH,
  initial: {},
  onCorrupted: 'delete',
});
