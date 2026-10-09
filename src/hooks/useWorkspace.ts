import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../utils/api';
import { useDocSync } from './useDocSync';
import { normalizeDoc, normalizeTask, type Doc, type Task } from '../lib/types';

export interface DocTemplate {
  label: string;
  icon: string;
  tags: string[];
  content: string;
}

export const TEMPLATES: DocTemplate[] = [
  { label: 'Blank page', icon: '📝', tags: ['Draft'], content: '<p></p>' },
  {
    label: 'Meeting notes', icon: '🗒️', tags: ['Meeting'],
    content: '<h2>Agenda</h2><ul><li></li></ul><h2>Notes</h2><p></p><h2>Action items</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li></ul>',
  },
  {
    label: 'Project plan', icon: '🚀', tags: ['Project'],
    content: '<h2>Goal</h2><p>What are we trying to achieve?</p><h2>Milestones</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Define scope</p></li><li data-type="taskItem" data-checked="false"><p>Build the first version</p></li><li data-type="taskItem" data-checked="false"><p>Launch</p></li></ul><h2>Risks</h2><p></p>',
  },
  {
    label: 'Daily journal', icon: '📅', tags: ['Journal'],
    content: '<h2>Focus today</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p></p></li></ul><h2>Notes</h2><p></p><h2>Wins</h2><p></p>',
  },
];

const COVERS = [
  'linear-gradient(120deg,#312e81,#6d28d9 55%,#c026d3)',
  'linear-gradient(120deg,#0c4a6e,#0e7490 55%,#10b981)',
  'linear-gradient(120deg,#7c2d12,#be123c 55%,#f59e0b)',
  'linear-gradient(120deg,#18181b,#3f3f46 55%,#71717a)',
  'linear-gradient(120deg,#1e3a8a,#4338ca 55%,#38bdf8)',
];

interface Options {
  onUnauthorized: () => void;
  onError: (message: string) => void;
}

export function useWorkspace({ onUnauthorized, onError }: Options) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Doc | null>(null);
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    let token: string | null = null;
    try { token = localStorage.getItem('auth_token'); } catch { /* ignore */ }
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, []);

  /** fetch wrapper: auth headers, cookie, 401 handling. */
  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const res = await fetch(apiUrl(path), { credentials: 'include', ...init, headers: { ...headers(), ...(init.headers as Record<string, string> | undefined) } });
    if (res.status === 401) onUnauthorized();
    return res;
  }, [headers, onUnauthorized]);

  const sync = useDocSync<Doc>({
    getHeaders: headers,
    onSaved: (docId, saved) => {
      const meta = { version: saved.version, updatedAt: saved.updatedAt };
      setDocs((p) => p.map((d) => (d.id === docId ? { ...d, ...meta } : d)));
    },
    onConflict: (_id, current) => setConflict(normalizeDoc(current as unknown as Record<string, unknown>)),
  });

  // ── Initial load ────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [dRes, tRes] = await Promise.all([request('/api/documents'), request('/api/tasks')]);
      if (!dRes.ok) throw new Error('Could not load your pages');
      const dData = ((await dRes.json()) as Record<string, unknown>[]).map(normalizeDoc);
      dData.forEach((d) => sync.setVersion(d.id, d.version));
      setDocs(dData);
      setActiveId((cur) => (cur && dData.some((d) => d.id === cur) ? cur : dData[0]?.id ?? null));
      if (tRes.ok) setTasks(((await tRes.json()) as Record<string, unknown>[]).map(normalizeTask));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not reach the server');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  useEffect(() => { void load(); }, [load]);

  const active = useMemo(() => docs.find((d) => d.id === activeId) ?? null, [docs, activeId]);

  // ── Documents ───────────────────────────────────────────────────────────
  const createDoc = useCallback(async (template: DocTemplate = TEMPLATES[0], parentId: string | null = null) => {
    try {
      const res = await request('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: parentId ? 'Untitled sub-page' : 'Untitled',
          icon: template.icon,
          cover: null,
          tags: template.tags,
          content: template.content,
          parentId,
        }),
      });
      if (!res.ok) throw new Error('Could not create the page');
      const created = normalizeDoc(await res.json());
      sync.setVersion(created.id, created.version);
      setDocs((p) => [created, ...p]);
      setActiveId(created.id);
      return created;
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create the page');
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, onError]);

  /** Optimistic local edit + debounced, versioned save. */
  const patchDoc = useCallback((id: string, patch: Partial<Doc>) => {
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, ...patch } : d)));
    sync.queue(id, patch as Record<string, unknown>);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.queue]);

  const randomCover = useCallback(() => COVERS[Math.floor(Math.random() * COVERS.length)], []);

  /** Removes the page from the UI immediately; the real DELETE fires after `graceMs` unless undone. */
  const deleteDoc = useCallback((id: string, graceMs = 6000) => {
    const index = docs.findIndex((d) => d.id === id);
    const doc = docs[index];
    if (!doc) return () => undefined;
    const remaining = docs.filter((d) => d.id !== id && d.parentId !== id);
    setDocs(remaining);
    if (activeId === id) setActiveId(remaining[0]?.id ?? null);
    const timer = setTimeout(() => {
      pendingDeletes.current.delete(id);
      void request(`/api/documents/${id}`, { method: 'DELETE' }).catch(() => onError('Could not delete the page'));
    }, graceMs);
    pendingDeletes.current.set(id, timer);
    return () => {
      const t = pendingDeletes.current.get(id);
      if (t) clearTimeout(t);
      pendingDeletes.current.delete(id);
      setDocs((p) => { const copy = [...p]; copy.splice(Math.min(index, copy.length), 0, doc); return copy; });
      setActiveId(doc.id);
    };
  }, [docs, activeId, request, onError]);

  const replaceDoc = useCallback((raw: unknown) => {
    const d = normalizeDoc(raw as Record<string, unknown>);
    sync.discard(d.id);
    sync.setVersion(d.id, d.version);
    setDocs((p) => p.map((x) => (x.id === d.id ? d : x)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.discard, sync.setVersion]);

  const resolveConflict = useCallback((choice: 'theirs' | 'mine') => {
    if (!conflict) return;
    if (choice === 'theirs') {
      replaceDoc(conflict);
    } else {
      const mine = docs.find((d) => d.id === conflict.id);
      sync.setVersion(conflict.id, conflict.version);
      if (mine) sync.queue(conflict.id, { title: mine.title, content: mine.content });
    }
    setConflict(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conflict, docs, replaceDoc]);

  // ── Tasks ───────────────────────────────────────────────────────────────
  const createTask = useCallback(async (partial: Partial<Task> = {}, assignee = 'You') => {
    try {
      const res = await request('/api/tasks', { method: 'POST', body: JSON.stringify({ name: 'New task', assignee, ...partial }) });
      if (!res.ok) throw new Error('Could not create the task');
      const t = normalizeTask(await res.json());
      setTasks((p) => [t, ...p]);
      return t;
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Could not create the task');
      return null;
    }
  }, [request, onError]);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    let before: Task | undefined;
    setTasks((p) => p.map((t) => { if (t.id === id) { before = t; return { ...t, ...patch }; } return t; }));
    try {
      const res = await request(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      if (!res.ok) throw new Error('Could not save the task');
    } catch (e) {
      if (before) { const prev = before; setTasks((p) => p.map((t) => (t.id === id ? prev : t))); }
      onError(e instanceof Error ? e.message : 'Could not save the task');
    }
  }, [request, onError]);

  const deleteTask = useCallback(async (id: string) => {
    const before = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    try {
      const res = await request(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not delete the task');
    } catch (e) {
      setTasks(before);
      onError(e instanceof Error ? e.message : 'Could not delete the task');
    }
  }, [request, tasks, onError]);

  return {
    docs, tasks, active, activeId, setActiveId, loading, loadError, reload: load,
    createDoc, patchDoc, deleteDoc, replaceDoc, randomCover,
    createTask, updateTask, deleteTask,
    sync, conflict, resolveConflict, headers,
  };
}
