import type { DaemonIdentity } from './stores/identity.ts';
import type { Account } from './stores/accounts.ts';

export const buildAccountResponse = (account: Account, { machineId, tailscale, daemon, opencode }: DaemonIdentity) => {
  return {
    name: account.name,
    id: account.id,
    machineId,
    endpoints: {
      opencode: { url: opencode.url, available: opencode.available, version: opencode.version },
      daemon: { url: daemon.url, available: daemon.available, version: daemon.version },
      tailscale: { url: tailscale.url, available: tailscale.available },
    },
  };
};
