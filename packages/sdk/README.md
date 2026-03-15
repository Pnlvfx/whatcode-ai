# @whatcode-ai/sdk

SDK and CLI to start [opencode](https://opencode.ai) and optionally expose it over HTTPS via [Tailscale](https://tailscale.com).

## Install

```bash
npm install @whatcode-ai/sdk
```

## CLI

```bash
# start opencode
npx @whatcode-ai/sdk

# start opencode + expose via Tailscale
npx @whatcode-ai/sdk --tailscale
```

### Options

| Flag          | Alias | Default | Description                                          |
| ------------- | ----- | ------- | ---------------------------------------------------- |
| `--tailscale` | `-t`  | `false` | Expose opencode over HTTPS on your Tailscale tailnet |
| `--help`      |       |         | Show help                                            |

## Programmatic usage

```ts
import { createWhatcodeServer } from '@whatcode-ai/sdk';

await createWhatcodeServer({
  tailscale: true, // optional
});
```

### `createWhatcodeServer(config)`

| Option      | Type      | Default     | Description                                       |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `tailscale` | `boolean` | `undefined` | When `true`, exposes opencode via Tailscale serve |

## How it works

1. Checks if opencode is already running on port `4096`.
2. If not, starts the opencode server bound to `0.0.0.0`.
3. If `tailscale: true`, verifies Tailscale is installed and authenticated, runs `tailscale serve --bg 4096`, and prints the HTTPS URL to use in your app.

## Requirements

- Node.js 20+
- [opencode](https://opencode.ai) installed
- [Tailscale](https://tailscale.com) installed and authenticated _(only for `tailscale: true`)_

## License

MIT
