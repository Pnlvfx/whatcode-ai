---
title: 'WhatCode Daemon: OpenCode Push Notifications and Remote Access'
sidebar_position: 5
sidebar_label: Daemon
description: The WhatCode daemon exposes OpenCode to your iPhone, sends push notifications when an agent finishes, and supports remote access over Tailscale.
keywords: [opencode push notifications, opencode remote access, opencode tailscale, opencode mobile, opencode daemon]
---

# Daemon

The WhatCode daemon (`@whatcode-ai/whatcode`) is a lightweight Node.js process that runs on your machine alongside OpenCode and connects it to the iOS app.

## Why do I need a daemon?

The daemon gives you three things that plain OpenCode cannot provide out of the box.

**Reachable from your phone.** By default, OpenCode binds to `127.0.0.1` only. The daemon exposes it on your local network (and optionally over Tailscale) so your iPhone can connect.

**A stable address.** OpenCode picks a random port on every restart. The daemon always listens on a fixed port (`8192`), so the app can reconnect automatically without any reconfiguration.

**Push notifications.** The daemon watches the OpenCode event stream and sends a push to your iPhone the moment an agent goes idle, hits an error, or needs your approval. The app does not need to be open.

Under the hood, the daemon connects to the local OpenCode server (starting it with `opencode serve --service` if it isn't already running) and layers these capabilities on top. You can still use OpenCode on its own. The daemon adds what the mobile app needs.

## Installation

No installation required. Run it directly with npx:

```bash
npx @whatcode-ai/whatcode start
```

Or install it globally:

```bash
npm install -g @whatcode-ai/whatcode
whatcode start
```

Or use it as a library in your own Node.js project:

```bash
npm install @whatcode-ai/sdk
```

```ts
import { createWhatcodeServer } from '@whatcode-ai/sdk';

await createWhatcodeServer({
  port: 8192,
  tailscale: true,
  password: 'secret',
  logLevel: 'none',
});
```

## How it works

When you run the daemon:

1. It starts OpenCode on localhost (or reuses an existing instance).
2. It starts a WhatCode server on port `8192` that sits in front of OpenCode, patching responses to improve the mobile experience.
3. It resolves the password: your `WHATCODE_PASSWORD` if set, otherwise the stored one, otherwise a newly generated one.
4. If `--tailscale` is passed, it also exposes a secure HTTPS URL on your tailnet (your private Tailscale network).

Run `whatcode pair` in another terminal to print the URL, password and QR code for the app.

The WhatCode server layer:

- **Patches project sorting:** the `/api/project` endpoint enriches each project with the timestamp of its most recent message and its latest session, so the app can sort projects by actual activity rather than creation date.
- **Disables caching:** forces `cache-control: no-cache` and `x-accel-buffering: no` on all proxied responses, which the SSE event stream the app subscribes to depends on.
- **Exposes `/info`:** returns the daemon version and the minimum supported app version.
- **Handles device pairing:** the `/user/pair` endpoint registers the app and returns an access token, `/user` returns the identity of the host (used by the app to deduplicate connections across multiple machines), and `/user/logout` removes the device.

## Push notifications

The daemon subscribes to the OpenCode event stream and watches for three events:

- `session.execution.succeeded`: the agent finished its turn and is waiting for your input.
- `session.execution.failed`: the agent hit an unrecoverable error.
- `permission.asked`: the agent needs your approval before it can proceed.

These are the OpenCode event names. When the daemon forwards them to the relay, it labels them `session.idle`, `permission.asked` and `session.error`, which are the event types listed in the [Privacy Policy](/policies/privacy-policy).

For finished and failed sessions, the daemon waits a few seconds before sending the push and skips it if you already viewed the session in another client.

Events from subagent sessions (sessions OpenCode starts from within another session) are ignored, so you only get notified for top-level sessions.

When any of these events fire, the daemon sends a push notification to your iPhone via a relay server using APNs. It usually arrives within seconds, even when the app is in the background. If the event stream drops, the daemon reconnects automatically with exponential backoff.

## Password protection

Your daemon is always protected by a password: every request must include it via HTTP Basic Auth. If you don't provide one, WhatCode generates a random password on first start and reuses it on every later start. It is stored encrypted in `~/.whatcode/auth` with owner-only permissions. The encryption only keeps the password out of plain sight (for example in backups or screen shares), the file permissions are the real protection.

To see the URL, password and QR code, run this in another terminal while the daemon is running:

```bash
npx @whatcode-ai/whatcode pair
```

`whatcode pair` fails if the daemon has not been started. To discard the stored password and generate a new one, run `whatcode reset`.

To use your own password instead, set the `WHATCODE_PASSWORD` environment variable:

```bash
WHATCODE_PASSWORD=your-password npx @whatcode-ai/whatcode start
```

Or add it to a `.env` file in the directory where you run the daemon:

```text
WHATCODE_PASSWORD=your-password
```

Via library, pass it as a parameter:

```ts
await createWhatcodeServer({ password: 'your-password' });
```

In the app, scan the QR code printed by `whatcode pair`, which embeds the URL and the password, or enter them manually when adding a connection.

HTTP Basic Auth sends credentials unencrypted, so on a plain HTTP local network URL the password can be read by anyone on that network. Use `--tailscale` if that matters for your setup.

## Log level

Control how much the daemon logs. The CLI defaults to `info` (shows info, warnings, and errors). The SDK defaults to `none` (silent). Use `debug` to see everything including internal events, notification dispatches, and Tailscale state.

Via CLI:

```bash
npx @whatcode-ai/whatcode start --log-level debug
```

Via library:

```ts
await createWhatcodeServer({ logLevel: 'debug' });
```

| Level   | Description                                             |
| ------- | ------------------------------------------------------- |
| `none`  | Silent, no output (SDK default)                         |
| `info`  | Info, warnings and errors (CLI default)                 |
| `debug` | Everything, including internal events and notifications |

## Tailscale

Passing `--tailscale` exposes the daemon over a secure HTTPS tunnel on your [Tailscale](https://tailscale.com) network:

```bash
npx @whatcode-ai/whatcode start --tailscale
```

This runs `tailscale serve --bg <port>` in the background, which proxies your local port over HTTPS using your Tailscale hostname (e.g. `https://my-mac.tail1234.ts.net`). The QR code printed by `whatcode pair` includes this URL so the app connects over Tailscale automatically. When you stop the daemon (Ctrl+C), it cleans up the Tailscale serve rule automatically.

### Requirements

- [Tailscale](https://tailscale.com) installed and authenticated (`tailscale up`)
- The same Tailscale account logged in on your iPhone, with Tailscale connected whenever you use the app remotely

## Resetting the daemon

If notifications stop working or device pairings get into a bad state, you can reset the daemon's stored data. This clears all paired devices and the stored notification state. After resetting, open the app and reconnect to pair your device again.

Via CLI:

```bash
npx @whatcode-ai/whatcode reset
```

Via library:

```ts
import { resetWhatcodeServer } from '@whatcode-ai/sdk';

await resetWhatcodeServer();
```

## API reference

### `createWhatcodeServer(config)`

| Option      | Type                          | Default     | Description                                                                                                         |
| ----------- | ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `port`      | `number`                      | `8192`      | Port the WhatCode server listens on. Change this if `8192` conflicts with another process on your machine.          |
| `tailscale` | `boolean`                     | `undefined` | When `true`, exposes the daemon over HTTPS via Tailscale serve. Requires Tailscale installed and authenticated.     |
| `password`  | `string`                      | `undefined` | Password for HTTP Basic Auth on all daemon endpoints. If omitted, a random one is generated and stored encrypted. |
| `logLevel`  | `'none' \| 'info' \| 'debug'` | `'none'`    | Controls log verbosity. `none` = silent, `info` = info/warn/error, `debug` = everything.                            |

### `resetWhatcodeServer()`

Clears all paired devices and the stored notification state. Use this if notifications stop working or if you need to unlink all devices from this machine.

## CLI reference

`npx @whatcode-ai/whatcode start` runs the `start` command by default, so `whatcode` and `whatcode start` are equivalent. The `reset` command must be called explicitly.

Run `npx @whatcode-ai/whatcode --version` to print the installed version without starting the daemon.

**Flags**

| Flag          | Type                          | Default | Description                                                      |
| ------------- | ----------------------------- | ------- | ---------------------------------------------------------------- |
| `--port`      | `number`                      | `8192`  | Port for the WhatCode server.                                    |
| `--tailscale` | `boolean`                     | -       | Expose via Tailscale HTTPS.                                      |
| `--log-level` | `'none' \| 'info' \| 'debug'` | `info`  | Controls log verbosity.                                          |
| `--version`   | `boolean`                     | -       | Print the installed version of `@whatcode-ai/whatcode` and exit. |

**Environment variables**

| Variable            | Default | Description                                                                        |
| ------------------- | ------- | ---------------------------------------------------------------------------------- |
| `WHATCODE_PASSWORD` | -       | Use your own password instead of the generated one. Set via environment variable or `.env` file. |

### Commands

| Command | Description                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------- |
| `start` | Start the daemon. This is the default command, so it also runs with no subcommand.                        |
| `reset` | Reset stored daemon data (paired devices and notification state). Use this if notifications stop working. |
