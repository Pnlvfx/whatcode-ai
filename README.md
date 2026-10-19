# whatcode-ai

[![npm version](https://img.shields.io/npm/v/@whatcode-ai/whatcode)](https://www.npmjs.com/package/@whatcode-ai/whatcode)
[![npm version](https://img.shields.io/npm/v/@whatcode-ai/sdk?label=%40whatcode-ai%2Fsdk)](https://www.npmjs.com/package/@whatcode-ai/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@whatcode-ai/whatcode)](https://www.npmjs.com/package/@whatcode-ai/whatcode)
[![npm downloads](https://img.shields.io/npm/dm/@whatcode-ai/sdk?label=sdk%20downloads)](https://www.npmjs.com/package/@whatcode-ai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

WhatCode is an iOS app for monitoring [OpenCode](https://opencode.ai) sessions, sending messages, and getting push notifications from your iPhone. This monorepo contains the daemon that connects OpenCode to the app (with optional [Tailscale](https://tailscale.com) remote access), the SDK, the documentation site, and a usage example.

<p align="center">
  <img src="apps/docs/static/img/screenshots/features.png" width="23%" alt="WhatCode session overview" />
  <img src="apps/docs/static/img/screenshots/model-picker.png" width="23%" alt="Model picker" />
  <img src="apps/docs/static/img/screenshots/voice.png" width="23%" alt="Voice input" />
  <img src="apps/docs/static/img/screenshots/commands.png" width="23%" alt="Slash commands" />
</p>

## Documentation

Full docs, API reference, and guides live at **[whatcode.app](https://whatcode.app)**.

## Quick start

```bash
npx @whatcode-ai/whatcode start
# or with Tailscale
npx @whatcode-ai/whatcode start --tailscale
```

## Packages

| Package                                        | Description                   |
| ---------------------------------------------- | ----------------------------- |
| [`@whatcode-ai/whatcode`](./packages/whatcode) | `whatcode` CLI                |
| [`@whatcode-ai/sdk`](./packages/sdk)           | Core SDK (programmatic usage) |
| [`@whatcode-ai/example`](./apps/example)       | Minimal usage example         |
| [`apps/docs`](./apps/docs)                     | Documentation site            |

## Development

```bash
git clone https://github.com/Pnlvfx/whatcode-ai.git
cd whatcode-ai
pnpm install
pnpm build
```

## License

MIT
