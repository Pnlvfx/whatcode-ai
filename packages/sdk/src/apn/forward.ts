import { relayClient } from '../client.ts';
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
    if (!entry.apnToken) {
      logger.info('apn', `Apn token not found for [${entry.name}:${entry.deviceName}], skipping notification.`);
      continue;
    }

    const { error, status } = await relayClient.relay.push.post({
      account_id: entry.id,
      device_id: entry.deviceId,
      token: entry.apnToken,
      title,
      body,
      event,
      session_id: sessionID,
      project_id: projectID,
      worktree: directory,
    });
    if (error) {
      if (status === 410) {
        await accountsStore.set((prev) => prev.map((e) => (e.deviceId === entry.deviceId ? { ...e, apnToken: undefined } : e)));
        logger.warn('notifications', `APN token unregistered for device ${entry.deviceId}, cleared from store`);
      } else {
        logger.error('notifications', `push failed: (${error.value.message ?? 'Failed to send notification!'})`);
      }
    } else {
      logger.debug('notifications', 'forwarded successfully.');
    }
  }
};
