import type { Failure, Success } from '../compiled/core/try-catch.ts';
import { execa } from 'execa';

const GIT_TIMEOUT_MS = 120_000;

export const runGit = async (directory: string, args: string[]): Promise<Success<string> | Failure<Error>> => {
  const result = await execa('git', ['--literal-pathspecs', ...args], {
    cwd: directory,
    timeout: GIT_TIMEOUT_MS,
    reject: false,
    env: { GIT_TERMINAL_PROMPT: '0', LC_MESSAGES: 'C' },
  });
  return result.failed ? { error: new Error(readOutput(result.stderr, result.stdout) ?? result.shortMessage) } : { data: result.stdout };
};

const readOutput = (...outputs: string[]) => outputs.map((output) => output.trim()).find((output) => output !== '');
