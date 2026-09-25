import { createSocket } from 'node:dgram';
import { networkInterfaces } from 'node:os';

export const getLocalIp = async () => {
  const ip = (await getLocalIpViaDgram()) ?? getLocalIpViaNetworkInterfaces();
  return ip ? { data: ip } : { error: { type: 'invalid-ip' as const, message: 'Local ip not found!' } };
};

const getLocalIpViaDgram = () => {
  return new Promise<string | undefined>((resolve, reject) => {
    const socket = createSocket('udp4');
    // eslint-disable-next-line sonarjs/no-hardcoded-ip
    socket.connect(80, '8.8.8.8', () => {
      const { address } = socket.address();
      socket.close();
      // Tailscale occupies the CGNAT range (100.64.0.0/10); if the OS routes
      // outbound traffic through the Tailscale adapter we get a 100.x address
      // which is only reachable via Tailscale. Fall through to the network
      // interfaces scan so we return the real LAN IP instead.
      resolve(isTailscaleCgnat(address) ? undefined : address);
    });
    socket.on('error', (error) => {
      socket.close();
      reject(error);
    });
  });
};

const getLocalIpViaNetworkInterfaces = (): string | undefined => {
  const nets = networkInterfaces();
  const candidates: string[] = [];

  for (const iface of Object.values(nets)) {
    if (!iface) continue;
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) candidates.push(net.address);
    }
  }
  return candidates.find((c) => isPrivate(c)) ?? candidates[0];
};

const isPrivate = (v: string) => v.startsWith('192.168.') || v.startsWith('10.') || (v.startsWith('172.') && second(v) >= 16 && second(v) <= 31);
// eslint-disable-next-line no-restricted-syntax
const second = (v: string) => Math.trunc(Number(v.split('.', 2)[1] ?? '0'));

// Tailscale uses the CGNAT range 100.64.0.0/10 (100.64–100.127)
const isTailscaleCgnat = (v: string) => v.startsWith('100.') && second(v) >= 64 && second(v) <= 127;
