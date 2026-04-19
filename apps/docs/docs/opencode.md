---
sidebar_position: 4
---

# OpenCode

[OpenCode](https://opencode.ai) is the open-source AI coding agent that WhatCode connects to. It runs entirely on your machine - your code never leaves it.

## What is OpenCode?

OpenCode is an AI coding assistant available as a terminal interface, desktop app, or IDE extension. It can read and write files, run commands, browse the web, and work through complex multi-step tasks autonomously. You give it a task, it works through it, and WhatCode notifies you when it's done.

## Installation

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

Refer to the [OpenCode documentation](https://opencode.ai/docs) for the full list of options including Bun, pnpm, Yarn, Scoop, Docker, and more.

## Running OpenCode

You don't need to start OpenCode manually. When you run the WhatCode daemon, it checks if OpenCode is already running on port `4096`. If it is, the daemon reuses it. If not, it starts it for you.

```bash
npx @whatcode-ai/sdk
```

If you want to start OpenCode separately first, that works too - the daemon will detect it and skip starting a second instance.

## Configuration

OpenCode reads its configuration from `~/.config/opencode/config.json`. You can set your preferred AI provider, model, and other options there. Refer to the [OpenCode documentation](https://opencode.ai/docs/config) for the full list of options.

## Ports

By default OpenCode listens on port `4096` and the WhatCode daemon listens on port `8192`. Both ports can be changed via CLI flags:

```bash
npx @whatcode-ai/sdk --opencode-port 4096 --port 8192
```
