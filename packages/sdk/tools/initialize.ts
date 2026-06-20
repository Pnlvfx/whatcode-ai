/* eslint-disable import/no-extraneous-dependencies */
import { copyFilesFromFolder } from '@goatjs/node/copy-files-from-folder';
import { homedir } from 'node:os';
import path from 'node:path';

const home = homedir();
const goatjs = path.join(home, 'Desktop', 'packages', 'goatjs', 'packages');
const coraline = path.join(home, 'Desktop', 'packages', 'coraline', 'packages');

const output = path.join('src', 'compiled');

await copyFilesFromFolder([
  {
    inputFolder: path.join(goatjs, 'core', 'src'),
    outputFolder: path.join(output, 'core'),
    files: ['capitalize.ts', 'error.ts', 'errors', 'object.ts'],
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
    inputFolder: path.join(coraline, 'server-logger', 'src'),
    outputFolder: path.join(output, 'server'),
    files: ['adapters.ts'],
  },
]);
