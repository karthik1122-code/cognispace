import type { Priority, Status } from './types';

/** Colours for task status and priority, shared by the board, table and home view. */
export const STATUS_STYLE: Record<Status, { dot: string; text: string }> = {
  Backlog: { dot: 'bg-faint', text: 'text-muted' },
  'In Progress': { dot: 'bg-warn', text: 'text-warn' },
  'In Review': { dot: 'bg-accent', text: 'text-accent' },
  Done: { dot: 'bg-ok', text: 'text-ok' },
};

export const PRIORITY_STYLE: Record<Priority, { bar: string; text: string }> = {
  Urgent: { bar: 'bg-danger', text: 'text-danger' },
  High: { bar: 'bg-warn', text: 'text-warn' },
  Medium: { bar: 'bg-accent', text: 'text-accent' },
  Low: { bar: 'bg-faint', text: 'text-muted' },
};
