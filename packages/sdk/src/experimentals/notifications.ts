/* eslint-disable no-console */
import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { SERVER_URL } from '../config.ts';

export const startNotifications = (): void => {
  void subscribeToEvents();
  console.log('[notifications] listening for events');
};

const subscribeToEvents = async (): Promise<void> => {
  const client = createOpencodeClient();
  const events = await client.event.subscribe();
  for await (const event of events.stream) {
    switch (event.type) {
      case 'session.idle': {
        await forwardToRelay(event.type);
        break;
      }
      case 'permission.asked': {
        await forwardToRelay(event.type);
        break;
      }
      case 'session.error': {
        await forwardToRelay(event.type);
        break;
      }
    }
  }
};

const forwardToRelay = async (eventType: string): Promise<void> => {
  const token = await loadToken();
  if (!token) return;
  await fetch(`${SERVER_URL}/relay/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, type: eventType }),
  });
};
