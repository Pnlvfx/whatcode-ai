---
title: 'FAQ: OpenCode Mobile App, iOS and iPad'
description: Answers about the OpenCode mobile app. Is there an OpenCode iOS app, does it work on iPad, and how do notifications and remote access work.
keywords: [opencode mobile app, opencode ios app, opencode ipad, opencode iphone, opencode android]
---

# FAQ: OpenCode Mobile App

## Is there an OpenCode mobile app?

Yes. WhatCode is a mobile app for [OpenCode](https://opencode.ai). It connects to the OpenCode server running on your machine, so you can browse projects, read and continue sessions, and get push notifications from your phone. See [WhatCode](/whatcode) for the full feature list.

## Is there an OpenCode iOS app?

Yes. WhatCode is available on the [App Store](https://apps.apple.com/us/app/whatcode/id6760623503) for iPhone.

## Is there an OpenCode iPad app?

WhatCode does not support iPad yet.

## Is there an OpenCode Android app?

WhatCode is currently an iOS app only.

## How do I get a notification when an OpenCode agent finishes?

Run the [WhatCode daemon](/daemon) on your machine and pair it with the app. The daemon sends a push notification when an agent finishes a turn, hits an error, or needs your permission, even when the app is closed.

## Can I use OpenCode from my phone when I'm away from home?

Yes. Start the daemon with the `--tailscale` flag to connect securely from anywhere. See [Daemon](/daemon) for the details.

## Does my code leave my machine?

No. OpenCode runs on your machine and WhatCode connects to it directly. See the [Privacy Policy](/policies/privacy-policy) for what the push relay handles.

## How much does WhatCode cost?

See [Pricing](/pricing).
