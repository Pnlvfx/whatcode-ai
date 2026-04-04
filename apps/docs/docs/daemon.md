---
sidebar_position: 5
---

# Daemon

The Whatcode daemon (`@whatcode-ai/sdk`) is a lightweight Node.js process that runs on your Mac alongside opencode. It serves three purposes: exposing opencode on your local network so the iOS app can reach it, patching certain opencode responses to improve the mobile experience, and delivering push notifications to your iPhone when an agent finishes.

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

Or use it as a library:

```bash
npm install @whatcode-ai/sdk
```

```ts
import { createWhatcodeServer } from '@whatcode-ai/sdk';

await createWhatcodeServer({
  proxy: true, // enable the proxy layer
  tailscale: true, // optional — expose over Tailscale
});
```

## How it works

When you run the daemon:

1. It starts opencode on `0.0.0.0:4096` (or reuses an existing instance).
2. In proxy mode, it starts an Express server on port `8192` that sits in front of opencode.
3. It prints your local network URL and a QR code. Scan it with the app to connect.
4. If `--tailscale` is passed, it also prints a secure HTTPS URL on your tailnet.

## Proxy mode

The proxy (`--proxy`) adds a thin layer between the iOS app and opencode. It currently:

- **Patches project sorting** — the `/project` endpoint enriches each project with the timestamp of its most recent message, so the app can sort projects by actual activity rather than creation date.
- **Disables caching** — forces `cache-control: no-cache` and `x-accel-buffering: no` on all proxied responses, which is important for the SSE event stream the app subscribes to.
- **Exposes `/whatcode/identity`** — returns the machine ID of the host, used by the app to deduplicate connections.
- **Handles device token registration** — the `/notifications/register` endpoint lets the app register its APNs token so the daemon can send push notifications.

## Push notifications

When proxy mode is enabled and the notification feature flag is active, the daemon subscribes to the opencode event stream and watches for:

- `session.idle` — the agent finished its turn.
- `session.error` — the agent hit an unrecoverable error.
- `permission.asked` — the agent needs your approval to proceed.

When any of these events fire, the daemon sends a push notification to your iPhone via a relay server using APNs. You receive it within seconds, even when the app is in the background.

## Tailscale

Passing `--tailscale` exposes opencode (or the proxy) over a secure HTTPS tunnel on your [Tailscale](https://tailscale.com) network:

```bash
npx @whatcode-ai/sdk --tailscale
```

This runs `tailscale serve --bg <port>` in the background, which proxies your local port over HTTPS using your Tailscale hostname (e.g. `https://my-mac.tail1234.ts.net`). The QR code printed in the terminal includes this URL so the app connects over Tailscale automatically.

When you stop the daemon (Ctrl+C), it cleans up the Tailscale serve rule automatically.

### Requirements for Tailscale

- [Tailscale](https://tailscale.com) installed and authenticated (`tailscale up`)
- The same Tailscale account logged in on your iPhone

### Install Tailscale on macOS

```bash
brew install tailscale
```

Then authenticate:

```bash
tailscale up
```

## CLI reference

| Flag           | Type    | Default   | Description                        |
| -------------- | ------- | --------- | ---------------------------------- |
| `--tailscale`  | boolean | —         | Expose via Tailscale HTTPS         |
| `--proxy`      | boolean | —         | Enable the Whatcode proxy layer    |
| `--port`       | number  | `4096`    | opencode port                      |
| `--proxy-port` | number  | `8192`    | Proxy server port                  |
| `--hostname`   | string  | `0.0.0.0` | Hostname to bind opencode to       |
| `--timeout`    | number  | —         | Timeout (ms) for opencode to start |
