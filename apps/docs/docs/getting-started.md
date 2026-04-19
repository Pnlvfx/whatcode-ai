---
sidebar_position: 2
---

# Getting Started

This guide walks you through connecting the WhatCode iOS app to your machine in a few minutes.

## Requirements

- [OpenCode](https://opencode.ai) installed and running
- The WhatCode app installed on your iPhone

## 1. Install OpenCode

The easiest way to install OpenCode is with the install script:

```bash
curl -fsSL https://opencode.ai/install | bash
```

Or with a package manager:

```bash
# npm
npm install -g opencode-ai

# Homebrew (macOS and Linux)
brew install anomalyco/tap/opencode

# Chocolatey (Windows)
choco install opencode
```

Refer to the [OpenCode documentation](https://opencode.ai/docs) for the full list of installation options including Bun, pnpm, Yarn, Scoop, and more.

## 2. Start the daemon

Run the following command in your terminal:

```bash
npx @whatcode-ai/sdk
```

This will:

- Start OpenCode on port `4096` (or reuse it if it's already running)
- Print your local network URL
- Display a QR code in the terminal

## 3. Connect the iOS app

Open the WhatCode app on your iPhone. On first launch you'll be taken through a short setup flow:

1. Tap **Get Started** and step through the intro screens.
2. On the last step, tap **Scan QR** and point your camera at the QR code in your terminal.
3. The app reads your machine ID and server URL automatically and adds the connection.

If your camera isn't available, tap **Continue without QR** and enter the URL manually.

## 4. You're connected

You should now see your OpenCode projects listed in the app. Tap any project to open its sessions, send messages, and receive notifications when the agent finishes a task.

## Connecting remotely with Tailscale

If you want to connect from outside your local network, use the `--tailscale` flag:

```bash
npx @whatcode-ai/sdk --tailscale
```

This sets up a secure HTTPS tunnel over your [Tailscale](https://tailscale.com) network. The QR code will include your Tailscale URL so the app can reach your machine from anywhere. See the [Daemon](/daemon) page for more details.
