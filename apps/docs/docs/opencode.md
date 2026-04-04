---
sidebar_position: 4
---

# opencode

[opencode](https://opencode.ai) is the open-source AI coding agent that Whatcode connects to. It runs entirely on your Mac — your code never leaves your machine.

## What is opencode?

opencode is a terminal-based AI coding assistant. It can read and write files, run commands, browse the web, and work through complex multi-step tasks autonomously. You give it a task, it works through it, and Whatcode notifies you when it's done.

## Installation

Install opencode globally with npm:

```bash
npm install -g opencode
```

Or with Homebrew:

```bash
brew install opencode
```

Verify the installation:

```bash
opencode --version
```

## Running opencode

You don't need to start opencode manually. When you run the Whatcode daemon, it checks if opencode is already running on port `4096`. If it is, the daemon reuses it. If not, it starts it for you.

```bash
npx @whatcode-ai/sdk
```

If you want to start opencode separately first, that works too — the daemon will detect it and skip starting a second instance.

## Configuration

opencode reads its configuration from `~/.config/opencode/config.json`. You can set your preferred AI provider, model, and other options there. Refer to the [opencode documentation](https://opencode.ai/docs) for the full list of options.

## Ports

By default opencode listens on port `4096`. The Whatcode daemon listens on port `8192` (proxy port) when running in proxy mode. Both ports can be changed via CLI flags:

```bash
npx @whatcode-ai/sdk --port 4096 --proxy-port 8192
```
