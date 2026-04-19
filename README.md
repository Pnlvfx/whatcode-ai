# whatcode-ai

Monorepo that provides a one-script setup to start [opencode](https://opencode.ai) — and optionally expose it over HTTPS via [Tailscale](https://tailscale.com) — so you can connect to it from anywhere (e.g. a private iOS app).

## Documentation

Full docs, API reference, and guides live at **[whatcode.app](https://whatcode.app)**.

## Quick start

```bash
npx @whatcode-ai/sdk
# or with Tailscale
npx @whatcode-ai/sdk --tailscale
```

## Packages

| Package | Description |
| ------- | ----------- |
| [`@whatcode-ai/sdk`](./packages/sdk) | Core SDK + `whatcode` CLI |
| [`@whatcode-ai/example`](./apps/example) | Minimal usage example |

## Development

```bash
git clone https://github.com/Pnlvfx/whatcode-ai.git
cd whatcode-ai
yarn install
yarn build
```

## License

MIT
