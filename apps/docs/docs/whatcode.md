---
sidebar_position: 3
---

# WhatCode

You start a long-running task, put your phone down, and WhatCode taps you on the shoulder when it's done.

WhatCode is an iOS app that brings [OpenCode](https://opencode.ai) to your iPhone. It connects to the OpenCode server running on your machine and lets you browse projects, read and continue coding sessions, and get a push notification the moment an agent finishes its work.

## Download

[Download on the App Store](https://apps.apple.com/us/app/whatcode/id6760623503)

## Features

**Project browser** - all your OpenCode projects in one place, sorted by most recent activity. Always know which session needs your attention next.

**Session view** - read the full conversation history of any session, see every file the agent touched, and continue the conversation without touching your computer.

**Push notifications** - get notified the moment something happens:

- An agent finishes a turn and goes idle
- An agent hits an error
- An agent needs your permission to proceed

**Multiple machines** - stay connected to every machine at once. Whether you run OpenCode on a work laptop, a personal desktop, or both, they all show up in one place.

**Tailscale support** - start the daemon with `--tailscale` and connect securely from anywhere, no VPN setup required.

## Setup

See [Getting Started](/) for the full connection walkthrough. In short:

1. Run `npx @whatcode-ai/whatcode` on your machine.
2. Scan the QR code with the app.
3. Done.

## Adding accounts manually

If you can't scan the QR code, tap **Continue without QR** during setup and enter:

- **Server URL** - the local IP printed in your terminal (e.g. `http://192.168.1.10:8192`) or your Tailscale HTTPS URL.
- **Password** - optional, only if you started the daemon with a password (see [Daemon](/daemon)).

## Notifications

Notifications are delivered via APNs (Apple Push Notification service) through a relay server. The daemon on your machine listens to the OpenCode event stream, detects when a session goes idle or errors, and sends a push through the relay to your device.

No polling. No battery drain. You get the notification within seconds of the agent finishing.
