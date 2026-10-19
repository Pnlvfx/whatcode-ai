import { resetAccounts } from '../stores/accounts.ts';
import { clearPassword } from '../stores/password.ts';

export const resetWhatcodeServer = async () => {
  await resetAccounts();
  return clearPassword();
};
