# @whatcode-ai/sdk

SDK to start [opencode](https://opencode.ai) and optionally expose it over HTTPS via [Tailscale](https://tailscale.com).

## Install

```bash
npm install @whatcode-ai/sdk
```

## Usage

```ts
import { createWhatcodeServer } from '@whatcode-ai/sdk';

await createWhatcodeServer({
  tailscale: true, // optional
});
```

### `createWhatcodeServer(config)`

| Option      | Type          | Default     | Description                                              |
| ----------- | ------------- | ----------- | -------------------------------------------------------- |
| `tailscale` | `boolean`     | `undefined` | When `true`, exposes opencode via Tailscale serve        |
| `hostname`  | `string`      | `0.0.0.0`   | Hostname to bind the opencode server to                  |
| `port`      | `number`      | `4096`      | Port to bind the opencode server to                      |
| `timeout`   | `number`      | `undefined` | Timeout in milliseconds for the opencode server to start |
| `signal`    | `AbortSignal` | `undefined` | AbortSignal to stop the opencode server programmatically |

## How it works

1. Checks if opencode is already running on port `4096`.
2. If not, starts the opencode server bound to `0.0.0.0`.
3. If `tailscale: true`, verifies Tailscale is installed and authenticated, runs `tailscale serve --bg 4096`, and prints the HTTPS URL to use in your app.

## CLI

Looking for the CLI? Use [@whatcode-ai/whatcode](https://www.npmjs.com/package/@whatcode-ai/whatcode).

## Requirements

- Node.js 20+
- [opencode](https://opencode.ai) installed
- [Tailscale](https://tailscale.com) installed and authenticated _(only for `tailscale: true`)_

## License

MIT
