---
slug: /
sidebar_position: 1
---

# Introduction

Whatcode is a mobile companion for [opencode](https://opencode.ai) — the open-source AI coding agent that runs on your machine. It lets you monitor and interact with your coding sessions from your iPhone, and get notified the moment an agent finishes its work.

## What's in here

This documentation covers three things:

- **Whatcode** — the iOS app itself: what it does, how to connect it to your machine, and how to navigate your projects and sessions.
- **opencode** — how to install and run the opencode server that Whatcode connects to.
- **Daemon** — the lightweight proxy that sits between the iOS app and opencode, enabling push notifications, better sorting, and optional remote access via Tailscale.

## Quick overview

1. Install opencode on your Mac.
2. Run the Whatcode daemon (`npx @whatcode-ai/sdk`) — it starts opencode and exposes it on your local network.
3. Open the iOS app, scan the QR code shown in your terminal, and you're connected.
4. Start a coding session. When the agent finishes, your phone buzzes.
