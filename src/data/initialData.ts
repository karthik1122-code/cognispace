import type { DocumentItem, Workspace, UserProfile } from '../types/workspace';

export const INITIAL_USER: UserProfile = {
  name: 'Karthik Uppari',
  email: 'karthik@antigravity.io',
  role: 'Principal Engineer',
  plan: 'Pro Member',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  statusText: 'Architecting CogniSpace 🧠',
  statusIndicator: 'online',
};

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-cognispace',
    name: 'CogniSpace Core',
    slug: 'cognispace-core',
    plan: 'Enterprise',
    icon: '🧠',
    avatarBg: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500',
    membersCount: 42,
  },
  {
    id: 'ws-labs',
    name: 'CogniSpace Labs',
    slug: 'cognispace-labs',
    plan: 'Pro',
    icon: '⚡',
    avatarBg: 'bg-violet-600',
    membersCount: 16,
  },
  {
    id: 'ws-personal',
    name: 'Personal Space',
    slug: 'personal-space',
    plan: 'Free',
    icon: '🔬',
    avatarBg: 'bg-emerald-600',
    membersCount: 1,
  },
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-eng',
    title: 'Engineering',
    icon: '⚙️',
    isExpanded: true,
    children: [
      {
        id: 'doc-arch',
        title: 'Frontend Architecture',
        icon: '🏛️',
        isExpanded: true,
        children: [
          {
            id: 'doc-design-tokens',
            title: 'Design System & Tokens Spec',
            icon: '🎨',
            status: 'in-review',
            updatedAt: '12 mins ago',
            isFavorite: true,
            author: {
              name: 'Karthik Uppari',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            },
            content: [
              {
                id: 'b-1',
                type: 'callout',
                calloutType: 'ai',
                content: 'CogniSpace AI Synthesis: Standardized on Zinc-950 dark aesthetic with glowing Indigo-Purple-Pink gradients, 1px subtle borders, and Inter font stack.',
              },
              {
                id: 'b-2',
                type: 'heading-2',
                content: 'Core Architectural Goals',
              },
              {
                id: 'b-3',
                type: 'paragraph',
                content: 'CogniSpace combines Notion’s fluid hierarchical page model with Linear’s keyboard-first speed and an AI-enhanced second brain workflow.',
              },
              {
                id: 'b-4',
                type: 'checklist',
                content: 'Configure Zinc-950 and Zinc-900 surface contrast ratios (WCAG AAA)',
                checked: true,
              },
              {
                id: 'b-5',
                type: 'checklist',
                content: 'Build 3-level deep expandable document tree with smooth micro-transitions',
                checked: true,
              },
              {
                id: 'b-6',
                type: 'checklist',
                content: 'Implement inline editable H1 with responsive breadcrumb synchronizer',
                checked: true,
              },
              {
                id: 'b-7',
                type: 'checklist',
                content: 'Add dynamic Command+K palette and quick action shortcuts',
                checked: true,
              },
              {
                id: 'b-8',
                type: 'heading-2',
                content: 'Tailwind Design Token Map',
              },
              {
                id: 'b-9',
                type: 'code',
                language: 'typescript',
                content: `// CogniSpace Theme Tokens
const cogniSpaceTheme = {
  background: 'zinc-950', // #09090b
  surface: 'zinc-900',    // #18181b
  border: 'zinc-800/80',  // rgba(39, 39, 42, 0.8)
  textPrimary: 'zinc-100',// #f4f4f5
  textMuted: 'zinc-400',  // #a1a1aa
  accentGradient: 'from-indigo-500 via-purple-500 to-pink-500',
};`,
              },
              {
                id: 'b-10',
                type: 'linear-issue',
                content: 'Sync with core frontend team on release schedule',
                issueDetails: {
                  identifier: 'COG-101',
                  title: 'Finalize CogniSpace second brain brand & token specification',
                  priority: 'high',
                  status: 'In Progress',
                },
              },
            ],
          },
          {
            id: 'doc-state-mgt',
            title: 'State Management & Sync',
            icon: '⚡',
            status: 'draft',
            updatedAt: '2 hours ago',
            content: [
              {
                id: 'b-sm-1',
                type: 'heading-2',
                content: 'CRDTs & Real-time Collaboration Engine',
              },
              {
                id: 'b-sm-2',
                type: 'paragraph',
                content: 'Exploring Yjs and WebRTC mesh topology for sub-millisecond local-first editing experience.',
              },
            ],
          },
        ],
      },
      {
        id: 'doc-api-specs',
        title: 'Backend API Specifications',
        icon: '🔌',
        status: 'published',
        updatedAt: 'Yesterday',
        children: [
          {
            id: 'doc-graphql',
            title: 'GraphQL Schema v2',
            icon: '📊',
            status: 'published',
            updatedAt: '3 days ago',
          },
        ],
      },
    ],
  },
  {
    id: 'doc-product',
    title: 'Product & Roadmap',
    icon: '🚀',
    isExpanded: false,
    children: [
      {
        id: 'doc-q4-roadmap',
        title: 'Q4 Product Roadmap',
        icon: '🗺️',
        status: 'in-review',
        updatedAt: '1 day ago',
        children: [
          {
            id: 'doc-ai-copilot',
            title: 'AI Copilot Block Engine',
            icon: '✨',
            status: 'draft',
            updatedAt: '4 hours ago',
          },
        ],
      },
      {
        id: 'doc-user-research',
        title: 'User Interview Insights',
        icon: '👥',
        status: 'published',
        updatedAt: '5 days ago',
      },
    ],
  },
  {
    id: 'doc-company',
    title: 'Company Wiki',
    icon: '📚',
    isExpanded: false,
    children: [
      {
        id: 'doc-onboarding',
        title: 'Engineering Onboarding',
        icon: '🌱',
        status: 'published',
        updatedAt: '1 week ago',
      },
      {
        id: 'doc-culture',
        title: 'Culture & Remote Guidelines',
        icon: '🌍',
        status: 'published',
        updatedAt: '2 weeks ago',
      },
    ],
  },
];
