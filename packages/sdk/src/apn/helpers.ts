import type { Message, Part, TextPart } from '@opencode-ai/sdk/v2';

export interface OpencodeMessage {
  info: Message;
  parts: Part[];
}

const BODY_MAX = 178;

export const trim = (text: string) => (text.length <= BODY_MAX ? text : `${text.slice(0, BODY_MAX - 1)}…`);

export const getLastUserModel = (messages: OpencodeMessage[]): string | undefined => {
  const lastUser = messages.findLast((m) => m.info.role === 'user');
  if (lastUser?.info.role !== 'user') return undefined;
  const { providerID, modelID } = lastUser.info.model;
  return `${providerID}/${modelID}`;
};

export const getLastAssistantText = (messages: OpencodeMessage[]): string | undefined => {
  const assistantEntries = messages.toReversed().filter((m) => m.info.role === 'assistant');

  for (const entry of assistantEntries) {
    const textPart = entry.parts.findLast((p) => isTextPart(p));
    if (textPart?.text) return textPart.text;
  }

  return undefined;
};

const isTextPart = (part: Part): part is TextPart => part.type === 'text';
