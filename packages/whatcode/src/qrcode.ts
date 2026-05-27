import qrcode from 'qrcode-terminal';


export const printQrCode = (url: string, password?: string): void => {
  const params = new URLSearchParams({ url });
  if (password) params.set('password', password);
  const deepLink = `whatcode://connect?${params.toString()}`;
  qrcode.generate(deepLink, { small: true });
};
