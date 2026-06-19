import { setTimeout } from 'node:timers/promises';

const ERROR_SUPPRESS_WINDOW_MS = 5000;

export const createSmartNotification = () => {
  const erroredSessions = new Set<string>();

  const scheduleErrorExpiry = async (sessionID: string): Promise<void> => {
    await setTimeout(ERROR_SUPPRESS_WINDOW_MS);
    erroredSessions.delete(sessionID);
  };

  return {
    // lock the notifications for 5 seconds when an error occured to prevent the double notification when an error occur
    lock: (sessionID: string) => {
      erroredSessions.add(sessionID);
      void scheduleErrorExpiry(sessionID);
    },
    // release it after receiving the idle event
    unlock: (sessionID: string) => {
      return erroredSessions.delete(sessionID);
    },
  };
};
