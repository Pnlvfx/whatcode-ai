export const getAdapter = async () => {
  if (process.versions['bun'] !== undefined) return;
  const { node } = await import('@elysiajs/node');
  return node();
};
