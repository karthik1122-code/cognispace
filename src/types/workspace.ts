export type DocumentStatus = 'draft' | 'in-review' | 'published' | 'archived';

export interface DocumentItem {
  id: string;
  title: string;
  icon?: string; // Emoji or Lucide icon name
  coverImage?: string;
  parentId?: string | null;
  children?: DocumentItem[];
  isExpanded?: boolean;
  status?: DocumentStatus;
  updatedAt?: string;
  author?: {
    name: string;
    avatar: string;
  };
  isFavorite?: boolean;
  content?: EditorBlock[];
}

export interface EditorBlock {
  id: string;
  type: 'heading-1' | 'heading-2' | 'paragraph' | 'checklist' | 'callout' | 'code' | 'ai-prompt' | 'linear-issue';
  content: string;
  checked?: boolean;
  language?: string;
  calloutType?: 'info' | 'ai' | 'warning' | 'success';
  issueDetails?: {
    identifier: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    status: 'Todo' | 'In Progress' | 'Done';
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  icon: string;
  avatarBg: string;
  membersCount: number;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  plan: string;
  avatar: string;
  statusText: string;
  statusIndicator: 'online' | 'busy' | 'away' | 'offline';
}

export interface BreadcrumbNode {
  id: string;
  title: string;
  icon?: string;
}
