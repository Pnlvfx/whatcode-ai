/* eslint-disable no-console */
import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { SERVER_URL } from '../config.ts';
import { getToken } from '../token-store.ts';

export const startNotifications = (): void => {
  void subscribeToEvents();
  console.log('[notifications] listening for events');
};

const subscribeToEvents = async (): Promise<void> => {
  const client = createOpencodeClient();
  const events = await client.event.subscribe();
  for await (const event of events.stream) {
    console.log('new event received', event);
    switch (event.type) {
      case 'session.idle': {
        await forwardToRelay('WhatCode', event.type);
        break;
      }
      case 'permission.asked': {
        await forwardToRelay('WhatCode', event.type);
        break;
      }
      case 'session.error': {
        await forwardToRelay('WhatCode', event.type);
        break;
      }
    }
  }
};

const forwardToRelay = async (title: string, body: string): Promise<void> => {
  const entry = getToken();
  if (!entry) return;
  const res = await fetch(`${SERVER_URL}/relay/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, title, body }),
  });

  if (!res.ok) {
    console.error(res.statusText, res.status);
  }
};
