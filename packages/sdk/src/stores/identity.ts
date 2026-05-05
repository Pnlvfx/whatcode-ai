export interface DaemonIdentity {
  machineId: string;
  name: string;
  opencodeUrl: string | undefined;
  daemonUrl: string | undefined;
  tailscaleUrl?: string;
}

let current: DaemonIdentity | undefined;

export const identityStore = {
  get: (): DaemonIdentity | undefined => current,
  set: (value: DaemonIdentity): void => {
    current = value;
  },
};
