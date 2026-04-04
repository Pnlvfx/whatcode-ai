---
sidebar_position: 6
---

# Support

Need help with Whatcode? We're here for you.

## Contact

For bug reports, feature requests, or general questions, reach out via email:

**[support@whatcode.ai](mailto:support@whatcode.ai)**

## GitHub

Found a bug or want to contribute? Open an issue on GitHub:

**[github.com/Pnlvfx/whatcode-ai](https://github.com/Pnlvfx/whatcode-ai/issues)**

## Common issues

**The app can't find my server**
Make sure the daemon is running on your Mac (`npx @whatcode-ai/sdk`) and that your iPhone is on the same Wi-Fi network. If you're connecting remotely, use the `--tailscale` flag.

**I'm not receiving push notifications**
Make sure you granted notification permissions when the app asked. You can re-enable them in **Settings → Whatcode → Notifications** on your iPhone.

**The QR code scan failed**
Tap **Continue without QR** and enter your server URL manually. You can find the URL printed in your terminal when the daemon starts.

**opencode won't start**
Make sure opencode is installed (`npm install -g opencode`) and that Node.js 20+ is available on your PATH.
