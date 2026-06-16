/* eslint-disable import/no-extraneous-dependencies */
import { copyFilesFromFolder } from '@goatjs/node/copy-files-from-folder';
import { homedir } from 'node:os';
import path from 'node:path';

const home = homedir();
const goatjs = path.join(home, 'Desktop', 'packages', 'goatjs', 'packages');

const output = path.join('src', 'compiled');

await copyFilesFromFolder([
  {
    inputFolder: path.join(goatjs, 'core', 'src'),
    outputFolder: path.join(output, 'core'),
    files: ['capitalize.ts', 'error.ts', 'errors'],
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
]);
