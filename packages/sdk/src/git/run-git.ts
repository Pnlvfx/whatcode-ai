import { execa } from 'execa';
import { gitError } from './git-error.ts';

const GIT_TIMEOUT_MS = 120_000;

export const runGit = async (directory: string, args: string[]) => {
  const result = await execa('git', ['--literal-pathspecs', ...args], {
    cwd: directory,
    timeout: GIT_TIMEOUT_MS,
    reject: false,
    env: { GIT_TERMINAL_PROMPT: '0', LC_MESSAGES: 'C' },
  });
  return result.failed ? { error: gitError(400, readOutput(result.stderr, result.stdout) ?? result.shortMessage ?? 'Git command failed') } : { data: result.stdout };
};

const readOutput = (...outputs: string[]) => outputs.map((output) => output.trim()).find((output) => output !== '');
