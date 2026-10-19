# @whatcode-ai/whatcode

CLI daemon for the [WhatCode](https://whatcode.app) iOS app. It starts [OpenCode](https://opencode.ai), pairs it with the app through a QR code, and sends push notifications when an agent finishes. It can also expose OpenCode over HTTPS via [Tailscale](https://tailscale.com).

Full documentation at **[whatcode.app](https://whatcode.app)**.

## Requirements

- [OpenCode](https://opencode.ai) installed
- Node.js 22.5 or newer

## Usage

```bash
npx @whatcode-ai/whatcode start
```

## Programmatic usage

Use [@whatcode-ai/sdk](https://www.npmjs.com/package/@whatcode-ai/sdk) instead.

## License

MIT
