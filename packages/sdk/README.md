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

| Option         | Type          | Default     | Description                                              |
| -------------- | ------------- | ----------- | -------------------------------------------------------- |
| `tailscale`    | `boolean`     | `undefined` | When `true`, exposes opencode via Tailscale serve        |
| `hostname`     | `string`      | `0.0.0.0`   | Hostname to bind the opencode server to                  |
| `port`         | `number`      | `8192`      | Port for the Whatcode server                             |
| `opencodePort` | `number`      | `4096`      | Port for the opencode server                             |
| `timeout`      | `number`      | `undefined` | Timeout in milliseconds for the opencode server to start |
| `signal`       | `AbortSignal` | `undefined` | AbortSignal to stop the opencode server programmatically |

## How it works

1. Starts opencode on localhost (or reuses an existing instance).
2. Starts the Whatcode server on port `8192` in front of opencode, patching responses to improve the mobile experience.
3. If `tailscale: true`, verifies Tailscale is installed and authenticated, runs `tailscale serve --bg 8192`, and prints the HTTPS URL to use in your app.

## CLI

Looking for the CLI? Use [@whatcode-ai/whatcode](https://www.npmjs.com/package/@whatcode-ai/whatcode).

## Requirements

- Node.js 20+
- [opencode](https://opencode.ai) installed
- [Tailscale](https://tailscale.com) installed and authenticated _(only for `tailscale: true`)_

## License

MIT
