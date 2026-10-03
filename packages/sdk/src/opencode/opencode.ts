// TODO [2026-10-10] opencode inferring issue
// eslint-disable-next-line sonarjs/no-internal-api-use
import type * as _ from '../../../../node_modules/@opencode/client/dist/shared-events.js';
import { Service } from '@opencode/client/service';
import { createWhatCodeClient } from './client.ts';

export const createOpencode = async () => {
  const endpoint = await Service.ensure();
  const client = createWhatCodeClient(endpoint);
  return { client, endpoint };
};
