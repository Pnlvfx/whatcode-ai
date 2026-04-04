---
sidebar_position: 3
---

# Whatcode

Whatcode is an iOS app that brings [opencode](https://opencode.ai) to your iPhone. It connects to the opencode server running on your Mac and lets you browse projects, read and continue coding sessions, and — most importantly — get a push notification the moment an AI agent finishes its work.

You start a long-running task, put your phone down, and Whatcode taps you on the shoulder when it's done.

## Features

**Project browser** — all your opencode projects are listed in one place, sorted by the most recent activity. Tap a project to see its sessions.

**Session view** — read the full conversation history of any session, see what the agent did, and continue the conversation from your phone.

**Push notifications** — get notified when:

- An agent finishes a turn and goes idle (turn complete)
- An agent hits an error
- An agent needs your permission to proceed

**Multiple accounts** — connect to more than one machine. Useful if you have a work Mac and a personal Mac, or a desktop and a laptop.

**Tailscale support** — when the daemon is started with `--tailscale`, you can connect from anywhere in the world over a secure, encrypted tunnel. No VPN configuration needed.

## Setup

See [Getting Started](/) for the full connection walkthrough. In short:

1. Run `npx @whatcode-ai/sdk` on your Mac.
2. Scan the QR code with the app.
3. Done.

## Adding accounts manually

If you can't scan the QR code, tap **Continue without QR** during setup and enter:

- **Server URL** — the local IP printed in your terminal (e.g. `http://192.168.1.10:4096`) or your Tailscale HTTPS URL.
- **Password** — optional, only if you started the daemon with `--password`.

## Notifications

Notifications are delivered via APNs (Apple Push Notification service) through a relay server. The daemon on your Mac listens to the opencode event stream, detects when a session goes idle or errors, and sends a push through the relay to your device.

No polling. No battery drain. You get the notification within seconds of the agent finishing.
