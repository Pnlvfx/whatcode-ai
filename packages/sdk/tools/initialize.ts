/* eslint-disable parallelize/no-sequential-await */
/* eslint-disable import-x/no-extraneous-dependencies */
import { copyFilesFromFolder } from '@goatjs/node/copy-files-from-folder';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { rimraf } from '@goatjs/rimraf';

const home = homedir();
const goatjs = path.join(home, 'Desktop', 'packages', 'goatjs', 'packages');
const coraline = path.join(home, 'Desktop', 'packages', 'coraline', 'packages');
const whatcode = path.join(home, 'Desktop', 'apps', 'whatcode');

const output = path.join('src', 'compiled');

await rimraf(output);

await copyFilesFromFolder([
  {
    inputFolder: path.join(goatjs, 'core', 'src'),
    outputFolder: path.join(output, 'core'),
    files: ['capitalize.ts', 'error.ts', 'number.ts', 'try-catch.ts'],
  },
  {
    inputFolder: path.join(goatjs, 'core', 'src', 'errors'),
    outputFolder: path.join(output, 'core', 'errors'),
    files: ['code.ts'],
  },
  {
    inputFolder: path.join(goatjs, 'store', 'src'),
    outputFolder: path.join(output, 'store'),
    files: ['store2.ts'],
  },
  {
    inputFolder: path.join(goatjs, 'node', 'src'),
    outputFolder: path.join(output, 'node'),
    files: ['logger.ts'],
  },
  {
    inputFolder: path.join(whatcode, 'src', 'lib'),
    outputFolder: path.join(output, 'whatcode', 'lib'),
    files: ['project.ts'],
  },
  {
    inputFolder: path.join(coraline, 'eden', 'src'),
    outputFolder: path.join(output, 'eden'),
    files: ['fetch.ts', 'hc.ts'],
  },
]);

// the sdk has no @goatjs/core dependency, so the vendored copies must import it through the relative compiled/core files
const coreImportPrefix = "'@goatjs/core/";

const toPosixRelative = (fromFile: string, toFile: string) => {
  const posixFromFile = fromFile.split(path.sep).join(path.posix.sep);
  return path.posix.relative(path.posix.dirname(posixFromFile), toFile);
};

const compiledFiles = await readdir(output, { recursive: true });

await Promise.all(
  compiledFiles
    .filter((file) => file.endsWith('.ts'))
    .map(async (file) => {
      const filePath = path.join(output, file);
      const content = await readFile(filePath, 'utf8');
      const [head = '', ...chunks] = content.split(coreImportPrefix);
      if (chunks.length === 0) return;
      const rewrittenChunks = chunks.map((chunk) => {
        const end = chunk.indexOf("'");
        const relative = toPosixRelative(file, `core/${chunk.slice(0, end)}.ts`);
        return `'${relative.startsWith('.') ? relative : `./${relative}`}${chunk.slice(end)}`;
      });
      await writeFile(filePath, [head, ...rewrittenChunks].join(''));
    }),
);
