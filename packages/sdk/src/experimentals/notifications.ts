/* eslint-disable no-console */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { SERVER_URL } from '../config.ts';

const RELAY_URL = `${SERVER_URL}/send`;
const TOKEN_DIR = path.join(homedir(), '.whatcode');
const TOKEN_PATH = path.join(TOKEN_DIR, 'push-token');

export const saveToken = async (token: string): Promise<void> => {
  await mkdir(TOKEN_DIR, { recursive: true });
  await writeFile(TOKEN_PATH, token, 'utf8');
  console.log('[notifications] token saved');
};

export const startNotifications = (): void => {
  void subscribeToEvents();
  console.log('[notifications] listening for events');
};

const subscribeToEvents = async (): Promise<void> => {
  const client = createOpencodeClient();
  const events = await client.event.subscribe();
  for await (const event of events.stream) {
    const isRelevant = event.type === 'session.idle' || event.type === 'session.error' || event.type === 'permission.asked';
    if (isRelevant) {
      await forwardToRelay(event.type);
    }
  }
};

const forwardToRelay = async (eventType: string): Promise<void> => {
  // TODO [2026-04-01] load the token once??
  const token = await loadToken();
  if (!token) return;
  await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceToken: token, type: eventType }),
  });
};

const loadToken = async (): Promise<string | undefined> => {
  try {
    const raw = await readFile(TOKEN_PATH, 'utf8');
    return raw.trim() || undefined;
  } catch {
    return undefined;
  }
};
