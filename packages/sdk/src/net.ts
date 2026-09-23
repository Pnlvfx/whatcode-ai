import net from 'node:net';

export const isServerRunning = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => {
        resolve(true);
      }) // EADDRINUSE etc.
      .once('listening', () => {
        tester.close(() => {
          resolve(false);
        });
      })
      .listen(port);
  });
};
