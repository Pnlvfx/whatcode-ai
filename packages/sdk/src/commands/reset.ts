import { accountsStore } from '../stores/accounts.ts';
import { apnTokenStore } from '../stores/apn-token.ts';

export const resetWhatcodeServer = async () => {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  await apnTokenStore.clear();
  await accountsStore.clear();
};
