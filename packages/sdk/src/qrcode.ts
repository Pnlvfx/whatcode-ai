/* eslint-disable no-console */
import qrcode from 'qrcode-terminal';

export const printQrCode = (url: string): void => {
  console.log(`[opencode] scan to connect: ${url}`);
  qrcode.generate(url, { small: true });
};
