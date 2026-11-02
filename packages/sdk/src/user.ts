import type { DaemonIdentity } from './stores/identity.ts';
import type { Account } from './stores/accounts.ts';

export const buildAccountResponse = (account: Account, { machineId, tailscale, tunnel, daemon }: DaemonIdentity) => {
  return {
    name: account.name,
    id: account.id,
    machineId,
    ...buildEndpoints({ tailscale, tunnel, daemon }),
  };
};

const buildEndpoints = ({ tailscale, tunnel, daemon }: Pick<DaemonIdentity, 'tailscale' | 'tunnel' | 'daemon'>) => {
  const local = { type: 'daemon' as const, url: daemon };
  if (tailscale) return { endpoint: { type: 'tailscale' as const, url: tailscale }, fallbackEndpoint: local };
  if (tunnel) return { endpoint: { type: 'tunnel' as const, url: tunnel }, fallbackEndpoint: local };
  return { endpoint: local, fallbackEndpoint: undefined };
};
