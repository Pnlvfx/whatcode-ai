---
sidebar_position: 5
---

# Daemon

The WhatCode daemon (`@whatcode-ai/sdk`) is a lightweight Node.js process that runs on your machine alongside OpenCode. It serves three purposes: exposing OpenCode on your local network so the iOS app can reach it, patching certain OpenCode responses to improve the mobile experience, and delivering push notifications to your iPhone when an agent finishes.

## Installation

No installation required. Run it directly with npx:

```bash
npx @whatcode-ai/sdk
```

Or install it globally:

```bash
npm install -g @whatcode-ai/sdk
whatcode
```

Or use it as a library in your own Node.js project:

```bash
npm install @whatcode-ai/sdk
```

```ts
import { createWhatcodeServer } from '@whatcode-ai/sdk';

await createWhatcodeServer({
  port: 8192,
  opencodePort: 4096,
  tailscale: true,
  password: 'secret',
  logLevel: 'none',
});
```

## How it works

When you run the daemon:

1. It starts OpenCode on localhost (or reuses an existing instance).
2. It starts a WhatCode server on port `8192` that sits in front of OpenCode, patching responses to improve the mobile experience.
3. It prints your local network URL and a QR code. Scan it with the app to connect.
4. If `--tailscale` is passed, it also prints a secure HTTPS URL on your tailnet.

The WhatCode server layer:

- **Patches project sorting** - the `/project` endpoint enriches each project with the timestamp of its most recent message, so the app can sort projects by actual activity rather than creation date.
- **Disables caching** - forces `cache-control: no-cache` and `x-accel-buffering: no` on all proxied responses, which is important for the SSE event stream the app subscribes to.
- **Exposes `/whatcode/identity`** - returns the machine ID of the host, used by the app to deduplicate connections across multiple machines.
- **Handles device token registration** - the `/notifications/register` and `/notifications/unregister` endpoints let the app register and remove its APNs token.

## Push notifications

The daemon subscribes to the OpenCode event stream and watches for three events:

- `session.idle` - the agent finished its turn and is waiting for your input.
- `session.error` - the agent hit an unrecoverable error.
- `permission.asked` - the agent needs your approval before it can proceed.

When any of these events fire, the daemon sends a push notification to your iPhone via a relay server using APNs. You receive it within seconds, even when the app is in the background. If the event stream drops, the daemon reconnects automatically with exponential backoff.

## Password protection

You can protect your daemon with a password. When set, every request must include the password via HTTP Basic Auth.

```ts
await createWhatcodeServer({ password: 'your-password' });
```

In the app, enter the password when adding a connection manually. The QR code does not embed the password.

## Log level

Control how much the daemon logs. The CLI defaults to `info` (shows info, warnings, and errors). The SDK defaults to `none` (silent). Use `debug` to see everything including internal events, APN token registrations, and Tailscale state.

Via CLI:

```bash
npx @whatcode-ai/sdk --log-level debug
```

Via library:

```ts
await createWhatcodeServer({ logLevel: 'debug' });
```

| Level | Description |
| --- | --- |
| `none` | Silent — no output (SDK default) |
| `info` | Info, warnings and errors (CLI default) |
| `debug` | Everything, including internal events and APN tokens |

## Tailscale

Passing `--tailscale` exposes the daemon over a secure HTTPS tunnel on your [Tailscale](https://tailscale.com) network:

```bash
npx @whatcode-ai/sdk --tailscale
```

This runs `tailscale serve --bg <port>` in the background, which proxies your local port over HTTPS using your Tailscale hostname (e.g. `https://my-mac.tail1234.ts.net`). The QR code printed in the terminal includes this URL so the app connects over Tailscale automatically. When you stop the daemon (Ctrl+C), it cleans up the Tailscale serve rule automatically.

### Requirements

- [Tailscale](https://tailscale.com) installed and authenticated (`tailscale up`)
- The same Tailscale account logged in on your iPhone

## Resetting the daemon

If notifications stop working or device registrations get into a bad state, you can reset the daemon stored data. This clears all saved APNs tokens, which stops push notification delivery for all linked devices. After resetting, open the app and reconnect to re-register your device.

```ts
import { resetWhatcodeServer } from '@whatcode-ai/sdk';

await resetWhatcodeServer();
```

## API reference

### `createWhatcodeServer(config)`

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `port` | `number` | `8192` | Port the WhatCode server listens on. Change this if `8192` conflicts with another process on your machine. |
| `opencodePort` | `number` | `4096` | Port the OpenCode server listens on. Must match what OpenCode is actually bound to. |
| `tailscale` | `boolean` | `undefined` | When `true`, exposes the daemon over HTTPS via Tailscale serve. Requires Tailscale installed and authenticated. |
| `password` | `string` | `undefined` | Protects all daemon endpoints with HTTP Basic Auth. The app will prompt for this password when connecting manually. |
| `logLevel` | `'none' \| 'info' \| 'debug'` | `'none'` | Controls log verbosity. `none` = silent, `info` = info/warn/error, `debug` = everything. |

### `resetWhatcodeServer()`

Clears all stored APNs device tokens. Use this if notifications stop working or if you need to unlink all devices from this machine.

## CLI reference

| Flag | Type | Default | Description |
| --- | --- | --- | --- |
| `--port` | `number` | `8192` | Port for the WhatCode server. |
| `--opencode-port` | `number` | `4096` | Port for the OpenCode server. |
| `--tailscale` | `boolean` | - | Expose via Tailscale HTTPS. |
| `--log-level` | `'none' \| 'info' \| 'debug'` | `info` | Controls log verbosity. |
