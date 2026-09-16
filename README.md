# whatcode-ai

[![npm version](https://img.shields.io/npm/v/@whatcode-ai/whatcode)](https://www.npmjs.com/package/@whatcode-ai/whatcode)
[![npm version](https://img.shields.io/npm/v/@whatcode-ai/sdk?label=%40whatcode-ai%2Fsdk)](https://www.npmjs.com/package/@whatcode-ai/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@whatcode-ai/whatcode)](https://www.npmjs.com/package/@whatcode-ai/whatcode)
[![npm downloads](https://img.shields.io/npm/dm/@whatcode-ai/sdk?label=sdk%20downloads)](https://www.npmjs.com/package/@whatcode-ai/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Monorepo that provides a one-script setup to start [opencode](https://opencode.ai) and optionally expose it over HTTPS via [Tailscale](https://tailscale.com), so you can connect to it from anywhere (e.g. a private iOS app).

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

## Development

```bash
git clone https://github.com/Pnlvfx/whatcode-ai.git
cd whatcode-ai
pnpm install
pnpm build
```

## License

MIT
