import type { DaemonIdentity } from './stores/identity.ts';
import type { Account } from './stores/accounts.ts';

const ENDPOINT_TYPES = ['opencode', 'daemon', 'tailscale'] as const;
type EndpointType = (typeof ENDPOINT_TYPES)[number];

interface Endpoint {
  url?: string;
  type: EndpointType;
  available: boolean;
}

export const buildAccountResponse = (account: Account, { machineId, tailscale, daemon, opencode }: DaemonIdentity) => {
  return {
    name: account.name,
    id: account.id,
    machineId,
    endpoints: [
      { type: 'tailscale', url: tailscale.url, available: tailscale.available },
      { type: 'daemon', url: daemon.url, available: daemon.available },
      { type: 'opencode', url: opencode.url, available: opencode.available },
    ] satisfies Endpoint[],
  };
};
