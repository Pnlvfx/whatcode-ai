export const createActiveSessionTracker = () => {
  let activeSessionID: string | undefined;

  return {
    getActiveSession: () => activeSessionID,
    setActiveSession: (sessionID: string | undefined): void => {
      activeSessionID = sessionID;
    },
  };
};

export const activeSessionTracker = createActiveSessionTracker();
