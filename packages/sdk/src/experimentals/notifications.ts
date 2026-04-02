/* eslint-disable no-console */
import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { SERVER_URL } from '../config.ts';
import { getToken } from '../token-store.ts';

export const startNotifications = (port: number): void => {
  void subscribeToEvents(port);
  console.log('[notifications] listening for events');
};

const subscribeToEvents = async (port: number): Promise<void> => {
  const client = createOpencodeClient({ baseUrl: `http://localhost:${port.toString()}` });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    try {
      const events = await client.global.event();
      for await (const event of events.stream) {
        switch (event.payload.type) {
          case 'session.idle': {
            await forwardToRelay('WhatCode', event.payload.type);
            break;
          }
          case 'permission.asked': {
            await forwardToRelay('WhatCode', event.payload.type);
            break;
          }
          case 'session.error': {
            await forwardToRelay('WhatCode', event.payload.type);
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

const forwardToRelay = async (title: string, body: string): Promise<void> => {
  const entry = getToken();
  console.log(entry);
  if (!entry) return;
  const res = await fetch(`${SERVER_URL}/relay/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, alert: { title, body } }),
  });

  if (!res.ok) {
    console.error(res.statusText, res.status);
  }
};
