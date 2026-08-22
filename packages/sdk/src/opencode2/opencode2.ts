import { Service } from '@opencode-ai/client/service';
import { OpenCode, type OpenCodeClient } from '@opencode-ai/client';
import { logger } from '../logger.ts';

export type OpencodeV2Client = OpenCodeClient;

export const opencodeV2 = async () => {
  logger.debug('opencode-v2', 'discovering service...');

  const endpoint = await Service.discover();

  if (!endpoint) {
    logger.debug('opencode-v2', 'no running opencode2 service found');
    return;
  }

  const authHeaders = Service.headers(endpoint);
  const client = OpenCode.make({ baseUrl: endpoint.url, ...(authHeaders && { headers: authHeaders }) });

  const health = await client.health.get();
  logger.debug('opencode-v2', `found running opencode2 at ${endpoint.url} version ${health.version}`);

  return { client, version: health.version, url: endpoint.url };
};
