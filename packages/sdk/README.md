# @whatcode-ai/sdk

SDK for the [WhatCode](https://whatcode.app) daemon. It starts [OpenCode](https://opencode.ai), serves it to the WhatCode iOS app with push notifications, and can expose it over HTTPS via [Tailscale](https://tailscale.com).

Full documentation at **[whatcode.app](https://whatcode.app)**.

## Requirements

- [OpenCode](https://opencode.ai) installed
- Node.js 22.5 or newer

## Install

```bash
npm install @whatcode-ai/sdk
```

## Usage

```ts
import { createWhatcodeServer } from '@whatcode-ai/sdk';

await createWhatcodeServer();
```

## CLI

Looking for the CLI? Use [@whatcode-ai/whatcode](https://www.npmjs.com/package/@whatcode-ai/whatcode).

## License

MIT
