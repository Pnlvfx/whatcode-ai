/* eslint-disable @typescript-eslint/no-deprecated */
import { relayClient } from '../client.ts';
import { logger } from '@goatjs/node/logger';
import { apnTokenStore } from '../stores/apn-token.ts';
import { parseError } from '@goatjs/core/error';

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
  const entries = await apnTokenStore.get();

  for (const entry of entries) {
    try {
      await relayClient.relay.push.v2.post({
        account_id: entry.userId,
        device_id: entry.deviceId,
        token: entry.token,
        title,
        body,
        event,
        session_id: sessionID,
        project_id: projectID,
        worktree: directory,
      });
      logger.debug('notifications', 'forwarded successfully.');
    } catch (err) {
      const error = parseError(err);
      if (error.message.includes('Unregistered')) {
        const entries = await apnTokenStore.get();
        await apnTokenStore.set(entries.filter((e) => e.deviceId !== entry.deviceId));
        logger.warn('notifications', `APN token unregistered for device ${entry.deviceId}, removed from store`);
      } else {
        logger.error('notifications', `push failed: (${error.message})`);
      }
    }
  }
};
