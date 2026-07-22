/* eslint-disable import/no-extraneous-dependencies */
import { copyFilesFromFolder } from '@goatjs/node/copy-files-from-folder';
import { homedir } from 'node:os';
import path from 'node:path';
import { rimraf } from '@goatjs/rimraf';

const home = homedir();
const goatjs = path.join(home, 'Desktop', 'packages', 'goatjs', 'packages');
const coraline = path.join(home, 'Desktop', 'packages', 'coraline', 'packages');

const output = path.join('src', 'compiled');

await rimraf(output);

await copyFilesFromFolder([
  {
    inputFolder: path.join(goatjs, 'core', 'src'),
    outputFolder: path.join(output, 'core'),
    files: ['capitalize.ts', 'error.ts', 'object.ts'],
  },
  {
    inputFolder: path.join(goatjs, 'core', 'src', 'errors'),
    outputFolder: path.join(output, 'core', 'errors'),
    files: ['fetch.ts', 'code.ts'],
  },
  {
    inputFolder: path.join(goatjs, 'store', 'src'),
    outputFolder: path.join(output, 'store'),
    files: ['store.ts'],
  },
  {
    inputFolder: path.join(goatjs, 'node', 'src'),
    outputFolder: path.join(output, 'node'),
    files: ['logger.ts'],
  },
  {
    inputFolder: path.join(goatjs, 'zod', 'src'),
    outputFolder: path.join(output, 'zod'),
    files: ['parse.ts', 'error.ts'],
  },
  {
    inputFolder: path.join(coraline, 'server-logger', 'src'),
    outputFolder: path.join(output, 'server'),
    files: ['errors.ts'],
  },
]);
