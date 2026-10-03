import type { DaemonIdentity } from './stores/identity.ts';
import type { Account } from './stores/accounts.ts';

export const buildAccountResponse = (account: Account, { machineId, tailscale, daemon }: DaemonIdentity) => {
  return {
    name: account.name,
    id: account.id,
    machineId,
    endpoint: tailscale ? { type: 'tailscale' as const, url: tailscale } : { type: 'daemon' as const, url: daemon },
    fallbackEndpoint: tailscale ? { type: 'daemon' as const, url: daemon } : undefined,
  };
};
