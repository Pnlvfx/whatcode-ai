import qrcode from 'qrcode-terminal';
import { CLIENT_URL } from './config.ts';

export const printQrCode = (url: string, password?: string): void => {
  const params = new URLSearchParams({ url });
  if (password) params.set('password', password);
  // TODO [2026-05-01] we should handle this connection with url
  // usefull if user try to scan the qr directly from the camera (outside our app)
  const deepLink = `${CLIENT_URL}/connect?${params.toString()}`;
  qrcode.generate(deepLink, { small: true });
};
