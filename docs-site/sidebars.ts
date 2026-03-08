import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/sign-in', 'getting-started/complete-account-setup'],
    },
    {
      type: 'category',
      label: 'How-To Guides',
      items: [
        'how-to/subscribe-to-nodes',
        'how-to/alerts',
        'how-to/view-node-details',
        'how-to/use-the-map',
        'how-to/filter-nodes',
        'how-to/understand-node-cards',
        'how-to/organizations',
        'how-to/manage-account',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      items: ['concepts/dashboard-overview'],
    },
  ],
};

export default sidebars;
