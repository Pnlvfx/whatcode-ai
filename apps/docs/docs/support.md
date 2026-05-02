---
sidebar_position: 6
---

# Support

Need help with WhatCode? We're here for you.

## Contact

For bug reports, feature requests, or general questions, reach out via email:

**[support@whatcode.ai](mailto:support@whatcode.ai)**

## GitHub

Found a bug or want to contribute? Open an issue on GitHub:

**[github.com/Pnlvfx/whatcode-ai](https://github.com/Pnlvfx/whatcode-ai/issues)**

## Common issues

**The app can't find my server**
Make sure the daemon is running on your machine (`npx @whatcode-ai/sdk`) and that your iPhone is on the same local network. If you're connecting remotely, use the `--tailscale` flag.

**I'm not receiving push notifications**
Make sure you granted notification permissions when the app asked. You can re-enable them in **Settings > WhatCode > Notifications** on your iPhone. If permissions are on but notifications still don't arrive, try resetting the daemon and reconnecting the app to re-register your device:

```ts
import { resetWhatcodeServer } from '@whatcode-ai/sdk';
await resetWhatcodeServer();
```

**The QR code scan failed**
Tap **Continue without QR** and enter your server URL manually. You can find the URL printed in your terminal when the daemon starts.

**OpenCode won't start**
Make sure OpenCode is installed and that Node.js 20+ is available on your PATH. See the [OpenCode](/opencode) page for installation instructions.

**Something looks wrong and I need more detail**
Start the daemon with `--log-level debug` to enable verbose logging. This shows exactly what the daemon is doing - incoming connections, APN token registration, notification dispatches, and Tailscale state.

```bash
npx @whatcode-ai/sdk --log-level debug
```
