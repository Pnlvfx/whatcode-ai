# @whatcode-ai/whatcode

CLI to start [opencode](https://opencode.ai) and optionally expose it over HTTPS via [Tailscale](https://tailscale.com).

## Usage

```bash
# start opencode
npx @whatcode-ai/whatcode

# start opencode + expose via Tailscale
npx @whatcode-ai/whatcode --tailscale
```

## Options

| Flag              | Alias | Default   | Description                                          |
| ----------------- | ----- | --------- | ---------------------------------------------------- |
| `--tailscale`     | `-t`  | `false`   | Expose opencode over HTTPS on your Tailscale tailnet |
| `--hostname`      | `-H`  | `0.0.0.0` | Hostname to bind the opencode server to              |
| `--port`          | `-p`  | `8192`    | Port for the Whatcode server                         |
| `--opencode-port` |       | `4096`    | Port for the opencode server                         |
| `--timeout`       |       |           | Timeout (ms) for the opencode server to start        |
| `--help`          |       |           | Show help                                            |

## Requirements

- Node.js 20+
- [opencode](https://opencode.ai) installed
- [Tailscale](https://tailscale.com) installed and authenticated _(only for `--tailscale`)_

## Programmatic usage

Use [@whatcode-ai/sdk](https://www.npmjs.com/package/@whatcode-ai/sdk) instead.

## License

MIT
