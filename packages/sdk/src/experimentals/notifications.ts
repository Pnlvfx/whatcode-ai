/* eslint-disable no-console */
import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { SERVER_URL } from '../config/config.ts';
import { getToken } from '../token-store.ts';
import { headers } from '../config/headers.ts';

export const startNotifications = (port: number): void => {
  void subscribeToEvents(port);
  console.log('[notifications] listening for events');
};

type NotificationEvent = 'session.idle' | 'permission.asked' | 'session.error';

const subscribeToEvents = async (port: number): Promise<void> => {
  const client = createOpencodeClient({ baseUrl: `http://localhost:${port.toString()}` });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    try {
      const events = await client.global.event();
      for await (const event of events.stream) {
        switch (event.payload.type) {
          case 'session.idle': {
            await forwardToRelay('WhatCode', 'A', event.payload.type);
            break;
          }
          case 'permission.asked': {
            await forwardToRelay('WhatCode', 'E', event.payload.type);
            break;
          }
          case 'session.error': {
            await forwardToRelay('WhatCode', 'I', event.payload.type);
            break;
          }
        }
      }
      console.log('[notifications] stream ended, reconnecting...');
    } catch (err) {
      console.error('[notifications] stream error, reconnecting...', err);
    }
  }
};

const forwardToRelay = async (title: string, body: string, event: NotificationEvent): Promise<void> => {
  const entry = getToken();
  if (!entry) return;
  const res = await fetch(`${SERVER_URL}/relay/push/v2`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id: entry.userId, token: entry.token, title, body, event }),
  });

  if (!res.ok) {
    // TODO if we get an invalid token error, delete the stored token, wait for the ios app to send the new one
    console.error(res.statusText, res.status);
  }
};
