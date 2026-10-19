# @whatcode-ai/docs

Source of the [whatcode.app](https://whatcode.app) documentation site, built with [Docusaurus](https://docusaurus.io/).

## Development

```bash
pnpm install
pnpm start
```

`pnpm start` runs a local development server. Most changes are reflected live.

## Build

```bash
pnpm build
```

Static output is written to the `build` directory. Use `pnpm serve` to preview it locally.

## Deployment

The site is hosted on Vercel. Deploy with:

```bash
pnpm run deploy
```

Use `pnpm run deploy` rather than `pnpm deploy`, because `deploy` is also a built-in pnpm command and takes precedence over the package script.

The script (`tools/deploy.ts`) does the following in order:

1. Checks the git status.
2. Removes the `build` and `.docusaurus` directories.
3. Pulls the Vercel project settings, builds with `vercel build --prod`, and deploys the prebuilt output to production.
4. Bumps the minor version in `package.json`, commits, pushes, and creates and pushes a `@whatcode-ai/docs@<version>` tag.

If the release step fails, the script reverts the working tree changes and rethrows the error.
