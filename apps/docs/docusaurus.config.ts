import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';
import { APP_URL, APP_STORE_URL, GITHUB_REPO_URL, GITHUB_EDIT_URL, ORG_NAME, PROJECT_NAME } from './src/constants';

const config: Config = {
  title: 'WhatCode AI',
  tagline: 'OpenCode mobile app for iPhone',
  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'WhatCode',
        alternateName: ['OpenCode mobile app', 'OpenCode iOS app'],
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'iOS',
        description: 'WhatCode is the OpenCode mobile app for iPhone. Monitor OpenCode sessions and get push notifications when your AI coding agent finishes.',
        url: APP_URL,
        downloadUrl: APP_STORE_URL,
      }),
    },
    { tagName: 'link', attributes: { rel: 'icon', href: '/favicon.ico', sizes: '48x48' } },
    { tagName: 'link', attributes: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' } },
    { tagName: 'link', attributes: { rel: 'icon', href: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' } },
    { tagName: 'link', attributes: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' } },
    { tagName: 'link', attributes: { rel: 'manifest', href: '/site.webmanifest' } },
  ],
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
    image: 'img/social-card.png',
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
      copyright: `Copyright © ${new Date().getFullYear().toString()} WhatCode AI. Built with Docusaurus.`,
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
