import type { InferRequestType } from 'hono/client';
import { relayClient } from '../auth/client.ts';
import { logger } from '../logger.ts';
import { getAccounts } from '../stores/accounts.ts';

type PushBody = InferRequestType<typeof relayClient.environment.push.$post>['json'];

export const forwardToRelay = async ({ body, event, worktree, project_id, session_id, title }: PushBody) => {
  const accountsResult = await getAccounts();
  if (accountsResult.error) return { error: accountsResult.error };

  const response = await relayClient.environment.push.$post({
    json: { title, body, event, session_id, project_id, worktree },
  });
  if (response.ok) {
    logger.debug('notifications', 'forwarded successfully.');
  } else {
    const { message } = await response.json();
    logger.error('notifications', `push failed: (${message})`);
  }

  return { data: { status: 'success' } };
};
