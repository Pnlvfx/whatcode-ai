import { relayClient } from '../client.ts';
import { parseError } from '../compiled/core/error.ts';
import { logger } from '../compiled/node/logger.ts';
import { accountsStore } from '../stores/accounts.ts';

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

export const forwardToRelay = async ({ body, event, directory, projectID, sessionID, title }: Params): Promise<void> => {
  const entries = await accountsStore.get();

  for (const entry of entries) {
    try {
      const { error } = await relayClient.relay.push.post({
        account_id: entry.id,
        device_id: entry.deviceId,
        token: entry.token,
        title,
        body,
        event,
        session_id: sessionID,
        project_id: projectID,
        worktree: directory,
      });
      if (error) {
        logger.error('notifications', error.value.message ?? 'Failed to send notification');
      } else {
        logger.debug('notifications', 'forwarded successfully.');
      }
    } catch (err) {
      const error = parseError(err);
      if (error.message.includes('Unregistered')) {
        await accountsStore.set((prev) => prev.filter((e) => e.deviceId !== entry.deviceId));
        logger.warn('notifications', `APN token unregistered for device ${entry.deviceId}, removed from store`);
      } else {
        logger.error('notifications', `push failed: (${error.message})`);
      }
    }
  }
};
