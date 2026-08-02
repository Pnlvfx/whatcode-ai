import { setTimeout } from 'node:timers/promises';

const ERROR_SUPPRESS_WINDOW_MS = 5000;
// Small delay applied to idle handling to let a concurrent error handler set the lock first.
export const IDLE_DELAY_MS = 150;

export const createSmartNotification = () => {
  const erroredSessions = new Set<string>();

  const scheduleErrorExpiry = async (sessionID: string): Promise<void> => {
    await setTimeout(ERROR_SUPPRESS_WINDOW_MS);
    erroredSessions.delete(sessionID);
  };

  return {
    // lock the notifications for 5 seconds when an error occurred to prevent double notification
    lock: (sessionID: string) => {
      erroredSessions.add(sessionID);
      void scheduleErrorExpiry(sessionID);
    },
    // consume the lock — returns true if a lock was held (idle should be suppressed)
    unlock: (sessionID: string) => {
      return erroredSessions.delete(sessionID);
    },
    isLocked: (sessionID: string) => {
      return erroredSessions.has(sessionID);
    },
  };
};
