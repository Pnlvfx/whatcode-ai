---
slug: /
title: 'WhatCode: OpenCode Mobile App for iPhone'
sidebar_position: 1
sidebar_label: Introduction
description: WhatCode is the OpenCode mobile app for iPhone. Monitor OpenCode sessions, send messages and get push notifications the moment your AI coding agent finishes.
keywords: [opencode mobile, opencode ios app, opencode iphone, opencode app, ai coding agent mobile, whatcode]
---

# WhatCode: OpenCode Mobile App for iPhone

You start a long-running coding task, step away from your desk, and your phone buzzes the moment the agent finishes. That's WhatCode.

WhatCode is the OpenCode mobile app for iOS: an iPhone companion for [OpenCode](https://opencode.ai), the open-source AI coding agent that runs on your machine. It lets you monitor sessions, send messages, and get push notifications in real time, all from your iPhone. Wondering about iPad or Android? See the [FAQ](/faq).

**[Download on the App Store](https://apps.apple.com/us/app/whatcode/id6760623503)**

## What's covered here

This documentation covers two things:

- **WhatCode**: the iOS app. What it does, how to connect it to your machine, and how to navigate your projects and sessions.
- **Daemon**: the lightweight server that bridges the iOS app and OpenCode, enabling push notifications, better project sorting, and optional remote access via Tailscale.

## Quick overview

1. Install OpenCode on your machine.
2. Run the WhatCode daemon (`npx @whatcode-ai/whatcode start`). It starts OpenCode and exposes it on your local network.
3. Open the iOS app, scan the QR code shown in your terminal, and you're connected.
4. Start a coding session. When the agent finishes, your phone buzzes.
