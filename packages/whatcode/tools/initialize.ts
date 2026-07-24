/* eslint-disable import/no-extraneous-dependencies */
import { copyFilesFromFolder } from '@goatjs/node/copy-files-from-folder';
import { homedir } from 'node:os';
import path from 'node:path';
import { rimraf } from '@goatjs/rimraf';

const home = homedir();
const goatjs = path.join(home, 'Desktop', 'packages', 'goatjs', 'packages');

const output = path.join('src', 'compiled');

await rimraf(output);

await copyFilesFromFolder([
  {
    inputFolder: path.join(goatjs, 'node', 'src'),
    outputFolder: path.join(output, 'node'),
    files: ['logger.ts'],
  },
]);
