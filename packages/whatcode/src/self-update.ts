import { execa } from 'execa';
import { logger } from '@whatcode-ai/sdk/internals/logger';
import { parseError } from '@whatcode-ai/sdk/internals/compiled/core/error';
import semver from 'semver';
import { fetchFreshVersion } from './update.ts';
import pkgJson from '../package.json' with { type: 'json' };

export const selfUpdate = async (currentVersion: string) => {
  const { data: latest, error } = await fetchFreshVersion();
  if (error) {
    process.exitCode = 1;
    logger.error('update', error.message, error);
    return;
  }

  if (!semver.gt(latest.version, currentVersion)) {
    logger.info('update', `already on the latest version (v${currentVersion})`);
    return;
  }

  await installLatest(currentVersion, latest.version);
};

const installLatest = async (currentVersion: string, latestVersion: string) => {
  logger.info('update', `updating v${currentVersion} -> v${latestVersion}`);
  try {
    await execa('npm', ['install', '--global', `${pkgJson.name}@latest`], { stdio: 'inherit' });
    logger.info('update', `updated to v${latestVersion}`);
  } catch (err) {
    process.exitCode = 1;
    const error = parseError(err);
    logger.error('update', error.message, error);
  }
};
