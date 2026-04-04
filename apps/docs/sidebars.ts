import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    { type: 'doc', id: 'intro', label: 'Introduction' },
    { type: 'doc', id: 'getting-started', label: 'Getting Started' },
    { type: 'doc', id: 'whatcode', label: 'Whatcode' },
    { type: 'doc', id: 'opencode', label: 'opencode' },
    { type: 'doc', id: 'daemon', label: 'Daemon' },
    { type: 'doc', id: 'support', label: 'Support' },
    {
      type: 'category',
      label: 'Policies',
      items: [
        { type: 'doc', id: 'policies/privacy-policy', label: 'Privacy Policy' },
        { type: 'doc', id: 'policies/terms', label: 'Terms of Use' },
      ],
    },
  ],
};

export default sidebars;
