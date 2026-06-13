import type { Message, Part, TextPart } from '@opencode-ai/sdk/v2';
import path from 'node:path';
import { capitalize } from '@goatjs/core/capitalize';

export interface OpencodeMessage {
  info: Message;
  parts: Part[];
}

const BODY_MAX = 178;

export const trim = (text: string) => (text.length <= BODY_MAX ? text : `${text.slice(0, BODY_MAX - 1)}…`);
export const isTextPart = (part: Part): part is TextPart => part.type === 'text';
export const getProjectName = (directory: string) => capitalize(directory === '/' ? 'root' : path.basename(directory));

export const getLastAssistantText = (messages: OpencodeMessage[]): string | undefined => {
  const assistantEntries = messages.toReversed().filter((m) => m.info.role === 'assistant');

  for (const entry of assistantEntries) {
    const textPart = entry.parts.findLast((p) => isTextPart(p));
    if (textPart?.text) return textPart.text;
  }

  return undefined;
};
