import type { DaemonIdentity } from '../server.ts';

let current: DaemonIdentity | undefined;

export const identityStore = {
  get: (): DaemonIdentity | undefined => current,
  set: (value: DaemonIdentity): void => {
    current = value;
  },
};
