---
sidebar_position: 6
---

# Support

Need help with WhatCode? We're here for you.

## Contact

For bug reports, feature requests, or general questions, reach out via email:

**[support@whatcode.app](mailto:support@whatcode.app)**

## GitHub

Found a bug or want to contribute? Open an issue on GitHub:

**[github.com/Pnlvfx/whatcode-ai](https://github.com/Pnlvfx/whatcode-ai/issues)**

## Common issues

**The app can't find my server**
Make sure the daemon is running on your machine (`npx @whatcode-ai/whatcode start`) and that your iPhone is on the same local network. If you're connecting remotely, use the `--tailscale` flag.

**I'm not receiving push notifications**
Make sure you granted notification permissions when the app asked. You can re-enable them in **Settings > WhatCode > Notifications** on your iPhone. If permissions are on but notifications still don't arrive, try resetting the daemon and reconnecting the app to pair your device again:

```bash
npx @whatcode-ai/whatcode reset
```

**The QR code scan failed**
Tap **Continue without QR** and enter your server URL manually. You can find the URL printed in your terminal when the daemon starts.

**OpenCode won't start**
Make sure OpenCode is installed and that Node.js 22.5 or newer is available on your PATH. See the [OpenCode](/opencode) page for installation instructions.

**Something looks wrong and I need more detail**
Start the daemon with `--log-level debug` to enable verbose logging. This shows exactly what the daemon is doing - incoming connections, notification dispatches, and Tailscale state.

```bash
npx @whatcode-ai/whatcode start --log-level debug
```
