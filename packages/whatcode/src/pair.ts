import { getPassword, getDaemonUrl } from '@whatcode-ai/sdk/internals';

export const getPairing = async () => {
  const [password, url] = await Promise.all([getPassword(), getDaemonUrl()]);
  if (password.error) return { data: undefined, error: password.error };
  if (url.error) return { data: undefined, error: url.error };
  return password.data === undefined || url.data === undefined
    ? { data: undefined, error: { message: NOT_STARTED } }
    : { data: { url: url.data, password: password.data }, error: undefined };
};

const NOT_STARTED = 'WhatCode has not been started yet, start it first with "whatcode start"';
