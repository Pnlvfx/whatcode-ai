# whatcode-ai

Monorepo that provides a one-script setup to start [opencode](https://opencode.ai) — and optionally expose it over HTTPS via [Tailscale](https://tailscale.com) — so you can connect to it from anywhere (e.g. a private iOS app).

## Packages

| Package                                  | Description               |
| ---------------------------------------- | ------------------------- |
| [`@whatcode-ai/sdk`](./packages/sdk)     | Core SDK + `whatcode` CLI |
| [`@whatcode-ai/example`](./apps/example) | Minimal usage example     |

## Quick start

### As a CLI

```bash
npx @whatcode-ai/sdk
# or with Tailscale
npx @whatcode-ai/sdk --tailscale
```

### As a package

```bash
npm install @whatcode-ai/sdk
```

```ts
import { createWhatcodeServer } from '@whatcode-ai/sdk';

await createWhatcodeServer({
  tailscale: true, // optional — exposes opencode over HTTPS on your tailnet
});
```

## How it works

1. **opencode** — starts the opencode server on `0.0.0.0:4096` (skipped if already running).
2. **Tailscale** _(optional)_ — runs `tailscale serve --bg 4096` to proxy the server over HTTPS on your tailnet, then prints the URL to use in your app.

## Requirements

- Node.js 20+
- [opencode](https://opencode.ai) installed
- [Tailscale](https://tailscale.com) installed and authenticated _(only if using `--tailscale`)_

## Development

```bash
git clone https://github.com/Pnlvfx/whatcode-ai.git
cd whatcode-ai
yarn install
yarn build
```

## License

MIT
