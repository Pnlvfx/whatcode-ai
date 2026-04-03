/* eslint-disable no-console */
import type { Part, TextPart } from '@opencode-ai/sdk/v2';
import { createOpencodeClient } from '@opencode-ai/sdk/v2';
import { SERVER_URL } from '../config/config.ts';
import { headers } from '../config/headers.ts';
import path from 'node:path';
import { apnTokenStore } from '../stores/apn-token.ts';

const BODY_MAX = 178;

export const startNotifications = (client: OpencodeClient): void => {
  void subscribeToEvents(client);
  console.log('[notifications] listening for events');
};

type NotificationEvent = 'session.idle' | 'permission.asked' | 'session.error';

type OpencodeClient = ReturnType<typeof createOpencodeClient>;

const trim = (text: string): string => (text.length <= BODY_MAX ? text : `${text.slice(0, BODY_MAX - 1)}…`);

const isTextPart = (part: Part): part is TextPart => part.type === 'text';

const capitalize = (string: string) => {
  const firstLetter = string.at(0);
  if (!firstLetter) return string;
  return firstLetter.toUpperCase() + string.slice(1);
};

const getProjectName = (directory: string): string => {
  return capitalize(directory === '/' ? 'root' : path.basename(directory));
};

const getMessages = async (client: OpencodeClient, sessionID: string) => {
  const res = await client.session.messages<true>({ sessionID });
  return res.data;
};

const getModelName = async (client: OpencodeClient, sessionID: string): Promise<string> => {
  const messages = await getMessages(client, sessionID);
  const lastUser = messages.toReversed().find((m) => m.info.role === 'user');
  if (lastUser?.info.role !== 'user') return 'unknown';
  const { providerID, modelID } = lastUser.info.model;
  const { data: config } = await client.config.providers<true>();
  const provider = config.providers.find((p) => p.id === providerID);
  return provider?.models[modelID]?.name ?? modelID;
};

const getLastAssistantText = async (client: OpencodeClient, sessionID: string): Promise<string | undefined> => {
  const messages = await getMessages(client, sessionID);
  const assistantEntries = messages.toReversed().filter((m) => m.info.role === 'assistant');

  for (const entry of assistantEntries) {
    const textPart = entry.parts.findLast((p) => isTextPart(p));
    if (textPart?.text) return textPart.text;
  }

  return undefined;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const subscribeToEvents = async (client: OpencodeClient): Promise<void> => {
  // TODO add a max retry?

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    try {
      const events = await client.global.event<true>();
      for await (const event of events.stream) {
        switch (event.payload.type) {
          case 'session.idle': {
            const { sessionID } = event.payload.properties;
            const { data: session } = await client.session.get<true>({ sessionID });
            const title = getProjectName(session.directory);
            const modelName = await getModelName(client, sessionID);
            const lastText = await getLastAssistantText(client, sessionID);
            const body = lastText ? trim(`${modelName}: ${lastText}`) : modelName;
            await forwardToRelay(title, body, 'session.idle', { sessionID, projectID: session.projectID, directory: session.directory });
            break;
          }
          case 'permission.asked': {
            const { sessionID, permission, patterns } = event.payload.properties;
            const { data: session } = await client.session.get<true>({ sessionID });
            const title = getProjectName(session.directory);
            const modelName = await getModelName(client, sessionID);
            const target = patterns[0] ?? permission;
            await forwardToRelay(title, trim(`${modelName} needs permission to: ${target}`), 'permission.asked', {
              sessionID,
              projectID: session.projectID,
              directory: session.directory,
            });
            break;
          }
          case 'session.error': {
            const { sessionID, error } = event.payload.properties;
            let session;
            if (sessionID) {
              ({ data: session } = await client.session.get<true>({ sessionID }));
            }
            const title = session ? getProjectName(session.directory) : 'WhatCode';
            const body = trim(typeof error?.data.message === 'string' ? error.data.message : 'An unexpected error occurred');
            await forwardToRelay(
              title,
              body,
              'session.error',
              session ? { sessionID, projectID: session.projectID, directory: session.directory } : undefined,
            );
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

interface RelayMeta {
  readonly sessionID?: string;
  readonly projectID?: string;
  readonly directory?: string;
}

const forwardToRelay = async (title: string, body: string, event: NotificationEvent, meta?: RelayMeta): Promise<void> => {
  const entry = await apnTokenStore.get();
  if (!entry) return;
  const res = await fetch(`${SERVER_URL}/relay/push/v2`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: entry.userId,
      token: entry.token,
      title,
      body,
      event,
      session_id: meta?.sessionID,
      project_id: meta?.projectID,
      worktree: meta?.directory,
    }),
  });

  if (!res.ok) {
    // TODO [2026-04-05] if we get an invalid token error, delete the stored token, wait for the ios app to send the new one
    console.error(res.statusText, res.status);
  }
};
