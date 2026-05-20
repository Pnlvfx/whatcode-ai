import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';
import { APP_URL, APP_STORE_URL, GITHUB_REPO_URL, GITHUB_EDIT_URL, ORG_NAME, PROJECT_NAME } from './src/constants';

const config: Config = {
  title: 'WhatCode AI',
  tagline: 'Documentation',
  favicon: 'favicon.ico',
  future: { v4: true },
  url: APP_URL,
  baseUrl: '/',
  organizationName: ORG_NAME,
  projectName: PROJECT_NAME,

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
          editUrl: GITHUB_EDIT_URL,
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
          href: APP_STORE_URL,
          label: 'App Store',
          position: 'right',
        },
        {
          href: GITHUB_REPO_URL,
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
              href: APP_STORE_URL,
            },
            {
              label: 'GitHub',
              href: GITHUB_REPO_URL,
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
        debug: false,
        mode: 'production',
      },
    ],
  ],
};

export default config;
