import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ListChecks, Loader2, Sparkles, SquareCheck, X } from 'lucide-react';
import { Avatar } from './Pills';
import { PRIORITY_STYLE } from '../../lib/taskStyles';
import { cn } from '../../lib/cn';
import type { SuggestResult, Task, TaskSuggestion } from '../../lib/types';

interface Props {
  title: string;
  load: () => Promise<SuggestResult>;
  create: (items: TaskSuggestion[]) => Promise<Task[]>;
  onDone: (created: Task[]) => void;
  onClose: () => void;
}

type Row = TaskSuggestion & { picked: boolean };

/** Shows the action items found on a page; the user edits and ticks the ones to add to the board. */
export function PageTasksDialog({ title, load, create, onDone, onClose }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [ai, setAi] = useState<SuggestResult['ai'] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // The parent passes a new function each render; read the latest one, but only load when asked.
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });

  const fetchRows = useCallback(async () => {
    try {
      const r = await loadRef.current();
      setRows(r.suggestions.map((s) => ({ ...s, picked: !s.exists })));
      setAi(r.ai);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this page.');
      setRows([]);
    }
  }, []);
  const retry = () => { setRows(null); setError(''); void fetchRows(); };

  useEffect(() => { void fetchRows(); }, [fetchRows]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const picked = (rows ?? []).filter((r) => r.picked && !r.exists && r.title.trim());
  const set = (i: number, patch: Partial<Row>) => setRows((rs) => rs && rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const submit = async () => {
    if (!picked.length) return;
    setBusy(true); setError('');
    try { onDone(await create(picked)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not add the tasks.'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Create tasks from page" onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[min(640px,92vh)] w-[min(560px,100%)] animate-pop-in flex-col rounded-2xl border border-line-strong bg-elevated shadow-pop">
        <header className="flex flex-none items-start gap-3 border-b border-line px-5 py-3.5">
          <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-accent/15 text-accent"><ListChecks size={16} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold">Create tasks from this page</h2>
            <p className="truncate text-[12.5px] text-muted">Action items in “{title || 'Untitled'}”. Each task links back here.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="btn-ghost h-7 w-7 !px-0"><X size={15} /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {rows === null && (
            <div aria-label="Reading the page" className="space-y-2.5">
              <p className="text-[13px] text-muted">Reading the page for action items…</p>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton h-[58px] w-full" />)}
            </div>
          )}

          {rows !== null && ai && !ai.ok && (
            <p role="status" className="mb-3 rounded-lg border border-line bg-fg/[0.03] px-3 py-2 text-[12.5px] text-muted">
              {ai.message} Showing the page's open to-dos only.
            </p>
          )}

          {rows !== null && rows.length === 0 && !error && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl border border-line text-faint"><SquareCheck size={18} /></div>
              <p className="text-[14px] font-medium">No open action items on this page</p>
              <p className="mx-auto mt-1 max-w-[340px] text-[12.5px] text-muted">Add a to-do with <kbd className="rounded border border-line px-1">/</kbd> → To-do list, or write who will do what, like “Ana will send the invoice by Friday”.</p>
            </div>
          )}

          {rows !== null && rows.length > 0 && (
            <ul className="space-y-2">
              {rows.map((r, i) => (
                <li key={i} className={cn('flex gap-3 rounded-xl border p-3 transition', r.exists ? 'border-line opacity-60' : r.picked ? 'border-accent/40 bg-accent/[0.04]' : 'border-line')}>
                  <input
                    type="checkbox"
                    checked={r.picked && !r.exists}
                    disabled={r.exists}
                    onChange={(e) => set(i, { picked: e.target.checked })}
                    aria-label={`Add “${r.title}”`}
                    className="mt-1 h-4 w-4 flex-none accent-[rgb(var(--accent))]"
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      value={r.title}
                      disabled={r.exists}
                      maxLength={200}
                      onChange={(e) => set(i, { title: e.target.value })}
                      aria-label="Task title"
                      className="w-full bg-transparent text-[13.5px] font-medium outline-none focus:underline focus:decoration-accent/50 focus:underline-offset-4"
                    />
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
                      {r.assignee && <span className="flex items-center gap-1.5"><Avatar name={r.assignee} size={16} />{r.assignee}</span>}
                      {r.due && <span className="flex items-center gap-1"><CalendarDays size={11} />{r.due}</span>}
                      <span className="flex items-center gap-1.5"><span className={cn('h-2.5 w-[3px] rounded-full', PRIORITY_STYLE[r.priority].bar)} />{r.priority}</span>
                      <span className="ml-auto flex items-center gap-1 text-faint">
                        {r.exists ? <><Check size={11} /> Already on the board</> : r.source === 'ai' ? <><Sparkles size={11} /> Found by AI</> : <><SquareCheck size={11} /> To-do on the page</>}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {error && (
            <div role="alert" className="mt-3 flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">
              <span className="flex-1">{error}</span>
              {rows !== null && rows.length === 0 && <button onClick={retry} className="btn-outline h-7">Try again</button>}
            </div>
          )}
        </div>

        <footer className="flex flex-none items-center gap-2 border-t border-line px-5 py-3">
          <span className="text-[12.5px] text-muted">{rows === null ? '' : `${picked.length} selected · added to Backlog`}</span>
          <button onClick={onClose} className="btn-ghost ml-auto">Cancel</button>
          <button onClick={() => void submit()} disabled={busy || picked.length === 0} className="btn-primary">
            {busy && <Loader2 size={14} className="animate-spin" />} Add {picked.length || ''} {picked.length === 1 ? 'task' : 'tasks'}
          </button>
        </footer>
      </div>
    </div>
  );
}
