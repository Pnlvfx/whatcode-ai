import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'WhatCode AI',
  tagline: 'Documentation',
  favicon: 'favicon.ico',
  future: { v4: true },
  url: 'https://whatcode.app',
  baseUrl: '/',
  organizationName: 'Pnlvfx',
  projectName: 'whatcode-ai',

  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/Pnlvfx/whatcode-ai/tree/main/apps/docs/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'WhatCode AI',
      logo: {
        alt: 'WhatCode AI Logo',
        src: 'img/light-logo.svg',
        srcDark: 'img/dark-logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://apps.apple.com/us/app/whatcode/id6760623503',
          label: 'App Store',
          position: 'right',
        },
        {
          href: 'https://github.com/Pnlvfx/whatcode-ai',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'App Store',
              href: 'https://apps.apple.com/us/app/whatcode/id6760623503',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/Pnlvfx/whatcode-ai',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} WhatCode AI. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
  plugins: [
    [
      'vercel-analytics',
      {
        debug: true,
        mode: 'auto',
      },
    ],
  ],
};

export default config;
