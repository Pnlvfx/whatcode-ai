/* eslint-disable no-console */

const reset = '\u001B[0m';

const colors = {
  gray: '\u001B[90m',
  cyan: '\u001B[36m',
  yellow: '\u001B[33m',
  red: '\u001B[31m',
  green: '\u001B[32m',
} as const;

const colorize = (color: keyof typeof colors, text: string): string => `${colors[color]}${text}${reset}`;

interface Logger {
  debug: (scope: string, message: string) => void;
  info: (scope: string, message: string) => void;
  warn: (scope: string, message: string) => void;
  error: (scope: string, message: string, err?: unknown) => void;
  init: (options: { debug: boolean }) => void;
}

let debugEnabled = false;

const formatScope = (scope: string): string => colorize('gray', `[${scope}]`);

export const logger = {
  init: ({ debug }: { debug: boolean }): void => {
    debugEnabled = debug;
  },
  debug: (scope: string, message: string): void => {
    if (!debugEnabled) return;
    console.log(`${colorize('cyan', 'debug')} ${formatScope(scope)} ${message}`);
  },
  info: (scope: string, message: string): void => {
    console.log(`${colorize('green', 'info')}  ${formatScope(scope)} ${message}`);
  },
  warn: (scope: string, message: string): void => {
    console.warn(`${colorize('yellow', 'warn')}  ${formatScope(scope)} ${message}`);
  },
  error: (scope: string, message: string, err?: unknown): void => {
    console.error(`${colorize('red', 'error')} ${formatScope(scope)} ${message}`, err ?? '');
  },
} satisfies Logger;
