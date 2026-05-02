/* eslint-disable no-console */

import * as z from 'zod';

const reset = '\u001B[0m';

const colors = {
  gray: '\u001B[90m',
  cyan: '\u001B[36m',
  yellow: '\u001B[33m',
  red: '\u001B[31m',
  green: '\u001B[32m',
} as const;

const colorize = (color: keyof typeof colors, text: string): string => `${colors[color]}${text}${reset}`;

export const logLevelSchema = z.literal(['none', 'info', 'debug']);
export type LogLevel = z.infer<typeof logLevelSchema>;

interface Logger {
  debug: (scope: string, message: string) => void;
  info: (scope: string, message: string) => void;
  warn: (scope: string, message: string) => void;
  error: (scope: string, message: string, err?: unknown) => void;
  init: (options: { logLevel: LogLevel }) => void;
}

let currentLevel: LogLevel = 'none';

const formatScope = (scope: string): string => colorize('gray', `[${scope}]`);

export const logger = {
  init: ({ logLevel }: { logLevel: LogLevel }): void => {
    currentLevel = logLevel;
  },
  debug: (scope: string, message: string): void => {
    if (currentLevel !== 'debug') return;
    console.log(`${colorize('cyan', 'debug')} ${formatScope(scope)} ${message}`);
  },
  info: (scope: string, message: string): void => {
    if (currentLevel === 'none') return;
    console.log(`${colorize('green', 'info')}  ${formatScope(scope)} ${message}`);
  },
  warn: (scope: string, message: string): void => {
    if (currentLevel === 'none') return;
    console.warn(`${colorize('yellow', 'warn')}  ${formatScope(scope)} ${message}`);
  },
  error: (scope: string, message: string, err?: unknown): void => {
    if (currentLevel === 'none') return;
    console.error(`${colorize('red', 'error')} ${formatScope(scope)} ${message}`, err ?? '');
  },
} satisfies Logger;
