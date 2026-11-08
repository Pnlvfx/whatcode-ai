import type { WhatCodeClient } from '../opencode/client.ts';
import type { ScheduledPrompt } from '../stores/scheduled-prompts.ts';
import { forwardToRelay } from './forward.ts';
import { trim } from './helpers.ts';
import { getProjectName } from '../compiled/whatcode/lib/project.ts';
import { logger } from '../logger.ts';

export const notifyScheduledPromptFailed = async (client: WhatCodeClient, prompt: ScheduledPrompt): Promise<void> => {
  const loggerName = 'notifications:scheduled-prompt';
  const { data: session, error } = await client.session.get({ sessionID: prompt.sessionId });
  if (error) {
    logger.error(loggerName, error.message);
    return;
  }

  const forwardResult = await forwardToRelay({
    title: getProjectName(session.location.directory),
    body: trim(`Scheduled prompt not sent: ${prompt.error ?? 'unknown error'}`),
    event: 'session.execution.failed',
    sessionID: prompt.sessionId,
    projectID: session.projectID,
    directory: session.location.directory,
  });
  if (forwardResult.error) {
    logger.error(loggerName, forwardResult.error.message);
  }
};
