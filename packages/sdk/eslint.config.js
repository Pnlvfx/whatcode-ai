import { nodeMonorepoConfigs } from '@goatjs/node-monorepo-eslint';
import { defineConfig, globalIgnores } from '@eslint/config-helpers';

export default defineConfig([
  globalIgnores(['dist']),
  ...nodeMonorepoConfigs({
    tsconfigRootDir: import.meta.dirname,
    restrictedImports: [
      {
        name: '@opencode-ai/sdk',
        message: 'Use @opencode-ai/sdk/v2 instead.',
      },
    ],
  }),
]);
