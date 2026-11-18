/* eslint-disable parallelize/no-sequential-await */
/* eslint-disable import-x/no-extraneous-dependencies */
import { copyFilesFromFolder } from '@goatjs/node/copy-files-from-folder';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { rimraf } from '@goatjs/rimraf';
import path from 'node:path';
import { dbz } from '@goatjs/dbz';
import { createGitClient } from '@goatjs/node/git';

const home = homedir();

const packages = {
  goatjs: path.join(home, 'Desktop', 'packages', 'goatjs'),
  coraline: path.join(home, 'Desktop', 'packages', 'coraline'),
  whatcode: path.join(home, 'Desktop', 'apps', 'whatcode'),
};

for (const value of Object.values(packages)) {
  const git = createGitClient({ cwd: value });
  await dbz.checkGitStatus(git, { local: false });
}

const output = path.join('src', 'compiled');

await rimraf(output);

await copyFilesFromFolder([
  {
    inputFolder: path.join(packages.goatjs, 'packages', 'core', 'src'),
    outputFolder: path.join(output, 'core'),
    files: ['capitalize.ts', 'error.ts', 'number.ts', 'try-catch.ts'],
  },
  {
    inputFolder: path.join(packages.goatjs, 'packages', 'core', 'src', 'errors'),
    outputFolder: path.join(output, 'core', 'errors'),
    files: ['code.ts'],
  },
  {
    inputFolder: path.join(packages.goatjs, 'packages', 'store', 'src'),
    outputFolder: path.join(output, 'store'),
    files: ['store2.ts'],
  },
  {
    inputFolder: path.join(packages.goatjs, 'packages', 'node', 'src'),
    outputFolder: path.join(output, 'node'),
    files: ['logger.ts'],
  },
  {
    inputFolder: path.join(packages.goatjs, 'packages', 'tailscale', 'src'),
    outputFolder: path.join(output, 'tailscale'),
    files: '*',
  },
  {
    inputFolder: path.join(packages.whatcode, 'src', 'lib'),
    outputFolder: path.join(output, 'whatcode', 'lib'),
    files: ['project.ts'],
  },
  {
    inputFolder: path.join(packages.coraline, 'packages', 'eden', 'src'),
    outputFolder: path.join(output, 'eden'),
    files: ['fetch.ts', 'hc.ts'],
  },
]);

// the sdk has no @goatjs/core or @goatjs/node dependency, so the vendored copies must import them through the relative compiled files
const vendoredPackages = ['core', 'node'];

const toPosixRelative = (fromFile: string, toFile: string) => {
  const posixFromFile = fromFile.split(path.sep).join(path.posix.sep);
  return path.posix.relative(path.posix.dirname(posixFromFile), toFile);
};

const rewritePackageImports = (file: string, content: string, packageName: string) => {
  const [head = '', ...chunks] = content.split(`'@goatjs/${packageName}/`);
  const rewrittenChunks = chunks.map((chunk) => {
    const end = chunk.indexOf("'");
    const relative = toPosixRelative(file, `${packageName}/${chunk.slice(0, end)}.ts`);
    return `'${relative.startsWith('.') ? relative : `./${relative}`}${chunk.slice(end)}`;
  });
  return [head, ...rewrittenChunks].join('');
};

const compiledFiles = await readdir(output, { recursive: true });

await Promise.all(
  compiledFiles
    .filter((file) => file.endsWith('.ts'))
    .map(async (file) => {
      const filePath = path.join(output, file);
      const content = await readFile(filePath, 'utf8');
      let rewritten = content;
      for (const packageName of vendoredPackages) {
        rewritten = rewritePackageImports(file, rewritten, packageName);
      }
      if (rewritten === content) return;
      await writeFile(filePath, rewritten);
    }),
);
