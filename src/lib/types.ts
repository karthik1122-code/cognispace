export type Status = 'Backlog' | 'In Progress' | 'In Review' | 'Done';
export type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';

export const STATUSES: Status[] = ['Backlog', 'In Progress', 'In Review', 'Done'];
export const PRIORITIES: Priority[] = ['Urgent', 'High', 'Medium', 'Low'];

export interface Doc {
  id: string;
  title: string;
  content: string;
  icon?: string;
  cover?: string | null;
  status?: Status;
  priority?: Priority;
  tags?: string[];
  isStarred?: boolean;
  parentId?: string | null;
  version?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface Task {
  id: string;
  name: string;
  status: Status;
  priority: Priority;
  assignee: string;
  dueDate: string;
  progress: number;
}

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
}

/** Server documents carry both `_id` and `id`; the UI only ever uses `id`. */
export function normalizeDoc(raw: Record<string, unknown>): Doc {
  const d = raw as unknown as Doc & { _id?: string };
  return { ...d, id: String(d.id ?? d._id) };
}
export function normalizeTask(raw: Record<string, unknown>): Task {
  const t = raw as unknown as Task & { _id?: string };
  return { ...t, id: String(t.id ?? t._id) };
}

export function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 604800) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
