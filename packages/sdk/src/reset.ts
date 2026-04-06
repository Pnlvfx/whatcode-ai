import { apnTokenStore } from './stores/apn-token.ts';

export const resetWhatcodeServer = async () => {
  await apnTokenStore.clear();
};
