import { useMemo, useState } from 'react';
import { CalendarDays, LayoutGrid, Plus, Rows3, Trash2 } from 'lucide-react';
import { Avatar, PRIORITY_STYLE, PriorityPill, STATUS_STYLE, StatusPill } from './Pills';
import { cn } from '../../lib/cn';
import { STATUSES, type Status, type Task } from '../../lib/types';

interface Props {
  tasks: Task[];
  loading: boolean;
  userName: string;
  onCreate: (partial?: Partial<Task>) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export function TasksView({ tasks, loading, userName, onCreate, onUpdate, onDelete }: Props) {
  const [mode, setMode] = useState<'board' | 'table'>('board');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);

  const stats = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'Done').length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { total: tasks.length, done, pct, open: tasks.length - done };
  }, [tasks]);

  const drop = (status: Status) => {
    if (dragId) {
      const t = tasks.find((x) => x.id === dragId);
      if (t && t.status !== status) onUpdate(dragId, { status, progress: status === 'Done' ? 100 : t.status === 'Done' ? 0 : t.progress });
    }
    setDragId(null);
    setOverCol(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none flex-wrap items-end gap-4 px-6 pb-4 pt-8 sm:px-10">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.03em]">Sprint board</h1>
          <p className="mt-1 text-[13px] text-muted">{stats.open} open · {stats.done} done</p>
        </div>

        <div className="ml-2 hidden min-w-[160px] flex-1 sm:block sm:max-w-[260px]">
          <div className="mb-1 flex justify-between text-[11.5px] text-faint"><span>Sprint progress</span><span>{stats.pct}%</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-fg/10" role="progressbar" aria-valuenow={stats.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-ok transition-[width] duration-500" style={{ width: `${stats.pct}%` }} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-line p-0.5" role="tablist" aria-label="View">
            {([['board', LayoutGrid, 'Board'], ['table', Rows3, 'Table']] as const).map(([k, Icon, label]) => (
              <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={cn('flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12.5px]', mode === k ? 'bg-fg/10 text-fg' : 'text-muted hover:text-fg')}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <button onClick={() => onCreate({ name: 'New task' })} className="btn-primary"><Plus size={14} /> New task</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 pb-10 sm:px-10">
        {loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-64" />)}</div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="mx-auto mt-16 max-w-sm text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-line bg-fg/[0.03] text-2xl">🗂️</div>
            <h2 className="text-[16px] font-semibold">No tasks yet</h2>
            <p className="mb-4 mt-1 text-[13px] text-muted">Create your first task and drag it across the board as work moves forward.</p>
            <button onClick={() => onCreate({ name: 'My first task' })} className="btn-primary"><Plus size={14} /> Create a task</button>
          </div>
        )}

        {!loading && tasks.length > 0 && mode === 'board' && (
          <div className="grid min-w-[880px] grid-cols-4 gap-4">
            {STATUSES.map((col) => {
              const items = tasks.filter((t) => t.status === col);
              return (
                <section
                  key={col}
                  aria-label={col}
                  onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
                  onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
                  onDrop={() => drop(col)}
                  className={cn('flex min-h-[280px] flex-col rounded-2xl border bg-fg/[0.02] p-2 transition-colors', overCol === col ? 'border-accent/60 bg-accent/5' : 'border-line')}
                >
                  <header className="flex items-center gap-2 px-2 pb-2 pt-1.5 text-[13px] font-medium">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[col].dot)} /> {col}
                    <span className="text-faint">{items.length}</span>
                    <button aria-label={`Add task to ${col}`} onClick={() => onCreate({ status: col, name: 'New task' })} className="ml-auto grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-fg/10 hover:text-fg"><Plus size={14} /></button>
                  </header>
                  <div className="flex flex-1 flex-col gap-2">
                    {items.map((t) => (
                      <article
                        key={t.id}
                        draggable
                        onDragStart={() => setDragId(t.id)}
                        onDragEnd={() => { setDragId(null); setOverCol(null); }}
                        className={cn('group cursor-grab rounded-xl border border-line bg-surface p-3 shadow-sm transition hover:border-line-strong active:cursor-grabbing', dragId === t.id && 'opacity-40')}
                      >
                        <div className="flex items-start gap-2">
                          <span className={cn('mt-1 h-3.5 w-[3px] flex-none rounded-full', PRIORITY_STYLE[t.priority].bar)} title={`${t.priority} priority`} />
                          <input
                            defaultValue={t.name}
                            aria-label="Task name"
                            onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== t.name) onUpdate(t.id, { name: v }); else e.target.value = t.name; }}
                            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            className="min-w-0 flex-1 bg-transparent text-[13.5px] font-medium outline-none"
                          />
                          <button aria-label="Delete task" onClick={() => onDelete(t.id)} className="hidden text-faint hover:text-danger group-hover:block"><Trash2 size={13} /></button>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <PriorityPill value={t.priority} onChange={(priority) => onUpdate(t.id, { priority })} />
                          <span className="ml-auto flex items-center gap-1 text-[11.5px] text-faint"><CalendarDays size={11} />{t.dueDate}</span>
                          <Avatar name={t.assignee || userName} size={20} />
                        </div>
                        {t.progress > 0 && t.progress < 100 && (
                          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-fg/10"><div className="h-full rounded-full bg-accent" style={{ width: `${t.progress}%` }} /></div>
                        )}
                      </article>
                    ))}
                    {items.length === 0 && <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line py-8 text-[12px] text-faint">Drop tasks here</div>}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading && tasks.length > 0 && mode === 'table' && (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="bg-fg/[0.03] text-[11.5px] uppercase tracking-wider text-faint">
                <tr><th className="px-4 py-2.5 font-medium">Task</th><th className="px-3 font-medium">Status</th><th className="px-3 font-medium">Priority</th><th className="px-3 font-medium">Assignee</th><th className="px-3 font-medium">Due</th><th className="w-10" /></tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="group border-t border-line hover:bg-fg/[0.025]">
                    <td className="px-4 py-2">
                      <input
                        defaultValue={t.name}
                        aria-label="Task name"
                        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== t.name) onUpdate(t.id, { name: v }); else e.target.value = t.name; }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                        className="w-full bg-transparent font-medium outline-none"
                      />
                    </td>
                    <td className="px-3"><StatusPill value={t.status} onChange={(status) => onUpdate(t.id, { status, progress: status === 'Done' ? 100 : t.progress })} /></td>
                    <td className="px-3"><PriorityPill value={t.priority} onChange={(priority) => onUpdate(t.id, { priority })} /></td>
                    <td className="px-3"><span className="flex items-center gap-2 text-muted"><Avatar name={t.assignee || userName} size={20} />{t.assignee}</span></td>
                    <td className="px-3 text-muted">{t.dueDate}</td>
                    <td className="pr-3 text-right"><button aria-label="Delete task" onClick={() => onDelete(t.id)} className="invisible text-faint hover:text-danger group-hover:visible"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
