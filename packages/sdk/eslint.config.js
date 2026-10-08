import { nodeMonorepoConfigs } from '@goatjs/node-monorepo-eslint';
import { defineConfig, globalIgnores } from '@eslint/config-helpers';

// eslint-disable-next-line unicorn/no-top-level-side-effects
export default defineConfig([globalIgnores(['dist']), ...nodeMonorepoConfigs({ tsconfigRootDir: import.meta.dirname })]);
