---
title: 'Getting Started: Connect the OpenCode iOS App to Your Machine'
sidebar_position: 2
sidebar_label: Getting Started
description: Step-by-step setup for WhatCode, the OpenCode iOS app. Run the daemon, scan the QR code with your iPhone and monitor OpenCode sessions in minutes.
keywords: [opencode ios app setup, opencode mobile setup, connect opencode to iphone, opencode remote access]
---

# Getting Started

This guide walks you through connecting the WhatCode iOS app to your machine in a few minutes.

## Requirements

- [OpenCode](https://opencode.ai) installed
- Node.js 22.5 or newer available on your PATH
- The WhatCode app installed on your iPhone. [Download on the App Store](https://apps.apple.com/us/app/whatcode/id6760623503)

## 1. Install OpenCode

Install OpenCode by following the instructions in the [OpenCode documentation](https://opencode.ai/docs).

## 2. Start the daemon

Run the following command in your terminal:

```bash
npx @whatcode-ai/whatcode start
```

The command starts the OpenCode service, or reuses it if it is already running, and then prints a pairing QR code in the terminal. You will scan this code with the app in the next step. The local network URL of the server is printed alongside it, and is only needed if you choose to connect manually.

## 3. Connect the iOS app

Open the WhatCode app on your device. On first launch you'll be taken through a short setup flow:

1. Tap **Get Started** and step through the intro screens.
2. On the last step, tap **Scan QR** and point your camera at the QR code in your terminal.
3. The app connects to your machine automatically.

If your camera isn't available, tap **Continue without QR** and enter the URL manually.

## 4. You're connected

You should now see your OpenCode projects listed in the app. Tap any project to open its sessions, send messages, and receive notifications when the agent finishes a task.

:::tip[Extra: Remote access with Tailscale]

To connect from outside your local network, start the daemon with the `--tailscale` flag:

```bash
npx @whatcode-ai/whatcode start --tailscale
```

The QR code then includes your [Tailscale](https://tailscale.com) URL, so the app can reach your machine from anywhere. See the [Daemon](/daemon) page for more details.

:::
