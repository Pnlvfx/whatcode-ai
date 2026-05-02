# @whatcode-ai/sdk

SDK to start [opencode](https://opencode.ai) and optionally expose it over HTTPS via [Tailscale](https://tailscale.com).

Full documentation at **[whatcode.app](https://whatcode.app)**.

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
| `logLevel`     | `'none' \| 'info' \| 'debug'` | `'none'` | Log verbosity. `none` = silent, `info` = info/warn/error, `debug` = everything. |
| `tailscale`    | `boolean`     | `undefined` | When `true`, exposes opencode via Tailscale serve        |
| `hostname`     | `string`      | `0.0.0.0`   | Hostname to bind the opencode server to                  |
| `port`         | `number`      | `8192`      | Port for the Whatcode server                             |
| `opencodePort` | `number`      | `4096`      | Port for the opencode server                             |
| `timeout`      | `number`      | `undefined` | Timeout in milliseconds for the opencode server to start |
| `signal`       | `AbortSignal` | `undefined` | AbortSignal to stop the opencode server programmatically |

## CLI

Looking for the CLI? Use [@whatcode-ai/whatcode](https://www.npmjs.com/package/@whatcode-ai/whatcode).

## License

MIT
