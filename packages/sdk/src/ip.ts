import { createSocket } from 'node:dgram';
import { networkInterfaces } from 'node:os';

export const getLocalIp = async (): Promise<string> => {
  const ip = (await getLocalIpViaDgram()) ?? getLocalIpViaNetworkInterfaces();
  if (!ip) throw new Error('Local ip not found!');
  return ip;
};

const getLocalIpViaDgram = (): Promise<string | undefined> => {
  return new Promise<string | undefined>((resolve) => {
    const socket = createSocket('udp4');
    // eslint-disable-next-line sonarjs/no-hardcoded-ip
    socket.connect(80, '8.8.8.8', () => {
      const { address } = socket.address();
      socket.close();
      resolve(address);
    });
    socket.on('error', () => {
      socket.close();
      resolve(undefined);
    });
  });
};

const getLocalIpViaNetworkInterfaces = (): string | undefined => {
  const nets = networkInterfaces();
  const candidates: string[] = [];

  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) candidates.push(net.address);
    }
  }
  return candidates.find((c) => isPrivate(c)) ?? candidates[0];
};

const isPrivate = (v: string) => v.startsWith('192.168.') || v.startsWith('10.') || (v.startsWith('172.') && second(v) >= 16 && second(v) <= 31);
const second = (v: string) => Math.trunc(Number(v.split('.', 2)[1] ?? '0'));
