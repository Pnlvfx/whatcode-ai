import { relayClient } from '../auth/client.ts';
import { logger } from '../logger.ts';
import { getAccounts } from '../stores/accounts.ts';

type NotificationEvent = 'session.idle' | 'permission.asked' | 'session.error';

interface RelayMeta {
  readonly sessionID: string;
  readonly projectID: string;
  readonly directory: string;
}

interface Params extends RelayMeta {
  title: string;
  body: string;
  event: NotificationEvent;
}

export const forwardToRelay = async ({ body, event, directory, projectID, sessionID, title }: Params) => {
  const accountsResult = await getAccounts();
  if (accountsResult.error) return { error: accountsResult.error };

  const { error, status } = await relayClient.environment.push.post({
    title,
    body,
    event,
    session_id: sessionID,
    project_id: projectID,
    worktree: directory,
  });
  if (error) {
    logger.error('notifications', `push failed: (${error.value.message ?? status.toString()})`);
  } else {
    logger.debug('notifications', 'forwarded successfully.');
  }

  return { data: { status: 'success' } };
};
