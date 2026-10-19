import { createStore2 } from '../compiled/store/store2.ts';
import { WHATCODE_ROOT } from '../config/constants.ts';
import * as z from 'zod/v4/mini';

export const saveDaemonUrl = (url: string) => daemonUrlStore.set({ url });

export const getDaemonUrl = async () => {
  const stored = await daemonUrlStore.get();
  return stored.error ? stored : { data: stored.data?.url, error: undefined };
};

export const clearDaemonUrl = () => daemonUrlStore.clear();

const daemonUrlStore = createStore2('daemon-url', z.strictObject({ url: z.string() }), { directory: WHATCODE_ROOT });
