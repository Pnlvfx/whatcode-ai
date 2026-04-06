/* eslint-disable no-console */
import qrcode from 'qrcode-terminal';
import { CLIENT_URL } from './config/config.ts';

export const printQrCode = (url: string, password?: string): void => {
  const params = new URLSearchParams({ url });
  if (password) params.set('password', password);
  const deepLink = `${CLIENT_URL}/connect?${params.toString()}`;
  qrcode.generate(deepLink, { small: true });
};
