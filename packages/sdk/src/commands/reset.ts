import { resetAccounts } from '../stores/accounts.ts';
import { resetNotificationState } from '../stores/notification-state.ts';

export const resetWhatcodeServer = async () => {
  await Promise.all([resetNotificationState(), resetAccounts()]);
};
