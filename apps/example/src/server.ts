import { createWhatcodeServer } from '@whatcode-ai/sdk';

/** This will:
 * 1. Start opencocode if not alreadyd running.
 * 2. Start tailscale, you can use the app from everywhere.
 * 3. Start our daemon, improve the experience on the app and allow you to receive notifications.
 */
await createWhatcodeServer({ tailscale: true, proxy: true });
