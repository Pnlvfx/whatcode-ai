---
title: 'WhatCode: OpenCode iOS App Features and Setup'
sidebar_position: 3
sidebar_label: WhatCode
description: Features of WhatCode, the OpenCode iOS app. Browse projects, continue sessions from your iPhone, switch models, and get push notifications when an agent finishes.
keywords: [opencode ios app, opencode mobile app, opencode iphone, opencode push notifications, opencode remote]
---

# WhatCode

WhatCode is the OpenCode iOS app: a mobile client that brings [OpenCode](https://opencode.ai) to your iPhone. It connects to the OpenCode server running on your machine and lets you browse projects, read and continue coding sessions, and get a push notification the moment an agent finishes its work.

## Download

[Download on the App Store](https://apps.apple.com/us/app/whatcode/id6760623503)

## Features

**Project browser.** All your OpenCode projects in one place, sorted by most recent activity.

**Session view.** Read the full conversation history of any session, see every file the agent touched, and continue the conversation from your phone.

**Model picker, voice input and slash commands.** Switch models from inside any session, dictate prompts instead of typing them, and run your OpenCode commands, such as `/init` and `/review`.

**Push notifications.** You are notified when:

- An agent finishes a turn and goes idle
- An agent hits an error
- An agent needs your permission to proceed

**Multiple machines.** Stay connected to several machines at once, for example a work laptop and a personal desktop. They all show up in one place.

**Tailscale support.** Start the daemon with `--tailscale` to connect securely from outside your local network. This requires Tailscale on both your machine and your iPhone. See [Daemon](/daemon#tailscale).

<div className="screenshots">
  <figure>
    <img src="/img/screenshots/features.png" alt="A WhatCode session showing an assistant reply that lists the app's main features, with the message input and keyboard below" />
    <figcaption>Read and continue your OpenCode sessions from your phone.</figcaption>
  </figure>
  <figure>
    <img src="/img/screenshots/model-picker.png" alt="The Select model sheet in WhatCode listing Big Pickle, Exo Free, Ling 3.1 Flash Free and LongCat 2.5 Preview Free, with a More models row" />
    <figcaption>Switch model from inside any session.</figcaption>
  </figure>
  <figure>
    <img src="/img/screenshots/voice.png" alt="WhatCode with the keyboard open and a voice input waveform button below it" />
    <figcaption>Dictate prompts instead of typing them.</figcaption>
  </figure>
  <figure>
    <img src="/img/screenshots/commands.png" alt="A slash in the WhatCode message input with the /init and /review commands suggested above it" />
    <figcaption>Run your OpenCode commands, like <code>/init</code> and <code>/review</code>.</figcaption>
  </figure>
</div>

## Setup

See [Getting Started](/getting-started) for the full walkthrough. In short:

1. Run `npx @whatcode-ai/whatcode start` on your machine.
2. Scan the QR code with the app.

## Connecting manually

If you can't scan the QR code, tap **Continue without QR** during setup and enter:

- **Server URL**: the local IP printed in your terminal (e.g. `http://192.168.1.10:8192`) or your Tailscale HTTPS URL.
- **Password**: optional, only if you started the daemon with a password (see [Daemon](/daemon#password-protection)).

## Notifications

Notifications are delivered via APNs (Apple Push Notification service) through a relay server. The daemon on your machine listens to the OpenCode event stream, detects when a session goes idle or errors, and sends a push through the relay to your device.

Because the daemon reacts to events instead of polling, the notification arrives within seconds of the agent finishing.
