---
title: 'FAQ: OpenCode Mobile App, iOS and iPad'
sidebar_position: 8
sidebar_label: FAQ
description: Answers about the OpenCode mobile app. Is there an OpenCode iOS app, does it work on iPad, and how do notifications and remote access work.
keywords: [opencode mobile app, opencode ios app, opencode ipad, opencode iphone, opencode android]
---

# FAQ: OpenCode Mobile App

## Is there an OpenCode mobile app?

Yes. WhatCode is a mobile app for [OpenCode](https://opencode.ai). It connects to the OpenCode server running on your machine, so you can browse projects, read and continue sessions, and get push notifications from your phone. See [WhatCode](/whatcode) for the full feature list.

## Is there an OpenCode iOS app?

Yes. WhatCode is available on the [App Store](https://apps.apple.com/us/app/whatcode/id6760623503) for iPhone.

## Is there an OpenCode iPad or Android app?

Not yet. WhatCode is currently available for iPhone only.

## How do I get a notification when an OpenCode agent finishes?

Run the [WhatCode daemon](/daemon) on your machine and pair it with the app. The daemon sends a push notification when an agent finishes a turn, hits an error, or needs your permission, even when the app is closed.

## Can I use OpenCode from my phone when I'm away from home?

Yes. Start the daemon with the `--tailscale` flag to connect securely from anywhere. See [Daemon](/daemon#tailscale) for the details.

## Does my code leave my machine?

WhatCode connects directly to the OpenCode server running on your machine, and your code and conversations do not pass through WhatCode's servers. OpenCode itself sends your prompts and code context to the model provider you configured, which is outside WhatCode's control. The push relay only receives what is needed to deliver a notification: the project or session name, a short snippet of the last response or error, and the event type. The [Privacy Policy](/policies/privacy-policy) lists exactly what it handles.

## How much does WhatCode cost?

WhatCode requires a subscription, and both plans start with a 3-day free trial. See [Pricing](/pricing) for the plans.
