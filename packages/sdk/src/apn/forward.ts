import { relayClient } from '../client.ts';
import { logger } from '../logger.ts';
import { deleteAccountApnToken, getAccounts } from '../stores/accounts.ts';

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
  const entries = await getAccounts();

  await Promise.all(
    entries
      .filter((e) => e.apnToken)
      .map(async (entry) => {
        const { error, status } = await relayClient.relay.push.post({
          account_id: entry.id,
          device_id: entry.deviceId,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          token: entry.apnToken!, // filtered
          title,
          body,
          event,
          session_id: sessionID,
          project_id: projectID,
          worktree: directory,
        });
        if (error) {
          if (status === 410) {
            await deleteAccountApnToken({ deviceId: entry.deviceId });
            logger.warn('notifications', `APN token unregistered for device ${entry.deviceId}, cleared from store`);
          } else {
            logger.error('notifications', `push failed: (${error.value.message ?? 'Failed to send notification!'})`);
          }
        } else {
          logger.debug('notifications', 'forwarded successfully.');
        }
      }),
  );
};
