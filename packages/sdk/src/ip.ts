import { networkInterfaces } from 'node:os';

const isPrivateIP = (address: string): boolean => {
  const second = Number.parseInt(address.split('.')[1] ?? '0', 10);
  return address.startsWith('192.168.') || address.startsWith('10.') || (address.startsWith('172.') && second >= 16 && second <= 31);
};

export const getLocalUrl = (port: number): string => {
  const nets = networkInterfaces();
  const candidates: string[] = [];
  for (const iface of Object.values(nets)) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) candidates.push(net.address);
    }
  }
  const address = candidates.find((v) => isPrivateIP(v)) ?? candidates[0];
  return address ? `http://${address}:${port.toString()}` : `http://localhost:${port.toString()}`;
};
