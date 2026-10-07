import { resetAccounts } from '../stores/accounts.ts';

export const resetWhatcodeServer = async () => {
  await resetAccounts();
};
