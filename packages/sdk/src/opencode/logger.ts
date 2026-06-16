import type { LogLevel as OpencodeLogLevel } from '@opencode-ai/sdk/v2';
import type { LogLevel } from '../compiled/node/logger.ts';

const map: Record<LogLevel, OpencodeLogLevel | undefined> = {
  debug: 'DEBUG',
  info: 'INFO',
  none: undefined,
};

export const mapToOpencodeLogLevel = (logLevel: LogLevel): OpencodeLogLevel | undefined => {
  return map[logLevel];
};
