---
sidebar_position: 2
---

# Getting Started

This guide walks you through connecting the Whatcode iOS app to your Mac in a few minutes.

## Requirements

- A Mac running macOS
- [Node.js](https://nodejs.org) 20 or later
- [opencode](https://opencode.ai) installed (`npm install -g opencode`)
- The Whatcode app installed on your iPhone

## 1. Start the daemon

Run the following command in your terminal:

```bash
npx @whatcode-ai/sdk
```

This will:

- Start opencode on port `4096` (or reuse it if it's already running)
- Print your local network URL
- Display a QR code in the terminal

## 2. Connect the iOS app

Open the Whatcode app on your iPhone. On first launch you'll be taken through a short setup flow:

1. Tap **Get Started** and step through the intro screens.
2. On the last step, tap **Scan QR** and point your camera at the QR code in your terminal.
3. The app reads your machine ID and server URL automatically and adds the connection.

If your camera isn't available, tap **Continue without QR** and enter the URL manually.

## 3. You're connected

You should now see your opencode projects listed in the app. Tap any project to open its sessions, send messages, and receive notifications when the agent finishes a task.

## Connecting remotely with Tailscale

If you want to connect from outside your home network, use the `--tailscale` flag:

```bash
npx @whatcode-ai/sdk --tailscale
```

This sets up a secure HTTPS tunnel over your [Tailscale](https://tailscale.com) network. The QR code will include your Tailscale URL so the app can reach your machine from anywhere. See the [Daemon](/daemon) page for more details.
