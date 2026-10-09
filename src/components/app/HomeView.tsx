import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CountUp, Ring, SplitWords, staggerChild, staggerParent } from '../ui/motion';
import { ArrowRight, Check, CheckCircle2, FileText, KanbanSquare, Plus, Sparkles, X } from 'lucide-react';
import { STATUS_STYLE } from './Pills';
import { TEMPLATES, type DocTemplate } from '../../hooks/useWorkspace';
import type { OnboardingStep } from '../../hooks/useOnboarding';
import { cn } from '../../lib/cn';
import { STATUSES, plainText, timeAgo, type AuthUser, type Doc, type Task } from '../../lib/types';

interface Props {
  user: AuthUser | null;
  docs: Doc[];
  tasks: Task[];
  loading: boolean;
  onboarding: { done: OnboardingStep[]; dismissed: boolean; dismiss: () => void };
  onOpenDoc: (id: string) => void;
  onNewDoc: (t: DocTemplate) => void;
  onOpenTasks: () => void;
  onOpenCopilot: () => void;
  onOpenPalette: () => void;
}

const STEPS: { key: OnboardingStep; title: string; hint: string }[] = [
  { key: 'page', title: 'Create a page', hint: 'Use New page or a template' },
  { key: 'slash', title: 'Insert a block with “/”', hint: 'Type / on an empty line' },
  { key: 'copilot', title: 'Ask Copilot to write something', hint: 'Press ⌘J' },
  { key: 'task', title: 'Add a task to the sprint board', hint: 'Open Sprint board → New task' },
  { key: 'palette', title: 'Open the command palette', hint: 'Press ⌘K' },
];

function greeting(): string {
  const h = new Date().getHours();
  return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function HomeView({ user, docs, tasks, loading, onboarding, onOpenDoc, onNewDoc, onOpenTasks, onOpenCopilot, onOpenPalette }: Props) {
  const first = user?.name?.split(' ')[0] || 'there';

  const stats = useMemo(() => {
    const words = docs.reduce((n, d) => { const t = plainText(d.content); return n + (t ? t.split(' ').length : 0); }, 0);
    const done = tasks.filter((t) => t.status === 'Done').length;
    return { pages: docs.length, words, open: tasks.length - done, pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0 };
  }, [docs, tasks]);

  const recent = useMemo(
    () => [...docs].sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()).slice(0, 6),
    [docs],
  );
  const active = useMemo(() => tasks.filter((t) => t.status === 'In Progress' || t.status === 'In Review').slice(0, 5), [tasks]);

  const byStatus = useMemo(() => STATUSES.map((st) => [st, tasks.filter((t) => t.status === st).length] as const), [tasks]);
  const activity = useMemo(() => {
    const days = Array.from({ length: 14 }, () => 0);
    const start = new Date(); start.setHours(0, 0, 0, 0);
    for (const d of docs) {
      if (!d.updatedAt) continue;
      const diff = Math.floor((start.getTime() - new Date(new Date(d.updatedAt).setHours(0, 0, 0, 0)).getTime()) / 86400000);
      if (diff >= 0 && diff < 14) days[13 - diff] += 1;
    }
    return days;
  }, [docs]);
  const activityMax = Math.max(1, ...activity);

  const completed = STEPS.filter((s) => onboarding.done.includes(s.key)).length;
  const showChecklist = !onboarding.dismissed && completed < STEPS.length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[960px] px-6 pb-24 pt-14 sm:px-10">
        <p className="font-mono text-[11.5px] uppercase tracking-[0.12em] text-faint">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em] sm:text-[40px]"><SplitWords text={`${greeting()}, ${first}.`} /></h1>

        {/* Quick actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => onNewDoc(TEMPLATES[0])}><Plus size={14} /> New page</button>
          <button className="btn-outline" onClick={onOpenCopilot}><Sparkles size={14} className="text-accent" /> Ask Copilot <span className="kbd">⌘J</span></button>
          <button className="btn-outline" onClick={onOpenTasks}><KanbanSquare size={14} /> Sprint board</button>
          <button className="btn-ghost" onClick={onOpenPalette}>Search <span className="kbd">⌘K</span></button>
        </div>

        {/* Stats */}
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {([['Pages', stats.pages, ''], ['Words written', stats.words, ''], ['Open tasks', stats.open, ''], ['Sprint done', stats.pct, '%']] as [string, number, string][]).map(([label, value, suffix]) => (
            <motion.div key={label} variants={staggerChild} className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
              <div className="text-[12px] text-faint">{label}</div>
              {loading ? <div className="skeleton mt-2 h-8 w-16" /> : <div className="mt-1 text-[30px] font-semibold tracking-[-0.03em]"><CountUp value={value} suffix={suffix} /></div>}
            </motion.div>
          ))}
        </motion.div>

        {/* Insights */}
        {!loading && (
          <motion.div variants={staggerParent} initial="hidden" animate="show" className="mt-3 grid gap-3 md:grid-cols-[1.6fr_1fr]">
            <motion.section variants={staggerChild} className="rounded-2xl border border-line bg-surface p-5" aria-label="Writing activity">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-medium text-muted">Pages edited, last 14 days</h2>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-faint"><span className="live-dot" />Live</span>
              </div>
              <div className="mt-5 flex h-[88px] items-end gap-1.5" role="img" aria-label="Bar chart of pages edited per day">
                {activity.map((n, i) => (
                  <div key={i} className="group relative flex-1">
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: `${Math.max(n / activityMax, 0.06) * 88}px` }}
                      transition={{ duration: 0.6, delay: 0.25 + i * 0.03, ease: [0.2, 0.7, 0.2, 1] }}
                      className={cn('w-full rounded-md', n ? 'bg-gradient-to-t from-accent/70 to-[#d38bff]' : 'bg-fg/10')}
                    />
                    <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-elevated px-1.5 py-0.5 text-[10.5px] opacity-0 shadow transition-opacity group-hover:opacity-100">{n}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10.5px] text-faint"><span>14d ago</span><span>Today</span></div>
            </motion.section>
            <motion.section variants={staggerChild} className="rounded-2xl border border-line bg-surface p-5" aria-label="Sprint overview">
              <h2 className="text-[13px] font-medium text-muted">Sprint</h2>
              <div className="mt-3 flex items-center gap-5">
                <div className="relative"><Ring pct={stats.pct} /><span className="absolute inset-0 grid place-items-center text-[17px] font-semibold tracking-tight">{stats.pct}%</span></div>
                <ul className="space-y-1.5 text-[12.5px]">
                  {byStatus.map(([st, n]) => (
                    <li key={st} className="flex items-center gap-2 text-muted"><span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[st].dot)} />{st}<span className="ml-auto pl-3 font-medium text-fg">{n}</span></li>
                  ))}
                </ul>
              </div>
            </motion.section>
          </motion.div>
        )}

        {/* Onboarding */}
        {showChecklist && (
          <section className="mt-8 rounded-2xl border border-line bg-surface p-5" aria-label="Getting started">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-[15px] font-semibold">Get started</h2>
              <span className="text-[12px] text-faint">{completed} of {STEPS.length}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-fg/10"><div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${(completed / STEPS.length) * 100}%` }} /></div>
              <button onClick={onboarding.dismiss} aria-label="Dismiss checklist" className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-fg/10 hover:text-fg"><X size={14} /></button>
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {STEPS.map((s) => {
                const done = onboarding.done.includes(s.key);
                return (
                  <li key={s.key} className="flex items-start gap-3 rounded-lg px-2 py-2">
                    <span className={cn('mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-full border', done ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong')}>{done && <Check size={11} />}</span>
                    <span><span className={cn('block text-[13.5px] font-medium', done && 'text-faint line-through')}>{s.title}</span><span className="block text-[12px] text-faint">{s.hint}</span></span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Recent pages */}
          <section aria-label="Recent pages">
            <h2 className="mb-3 text-[13px] font-medium text-muted">Recent pages</h2>
            {loading && <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[104px]" />)}</div>}
            {!loading && recent.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-[13.5px] text-muted">
                No pages yet. <button className="font-medium text-accent hover:underline" onClick={() => onNewDoc(TEMPLATES[0])}>Create your first one</button>.
              </div>
            )}
            <motion.div variants={staggerParent} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2">
              {recent.map((d) => (
                <motion.button variants={staggerChild} whileHover={{ y: -2 }} key={d.id} onClick={() => onOpenDoc(d.id)} className="group rounded-xl border border-line bg-surface p-4 text-left transition hover:border-line-strong hover:bg-elevated">
                  <div className="flex items-center gap-2"><span className="text-[18px]">{d.icon || <FileText size={16} />}</span><span className="truncate text-[14px] font-medium">{d.title || 'Untitled'}</span></div>
                  <p className="mt-2 line-clamp-2 min-h-[36px] text-[12.5px] leading-relaxed text-muted">{plainText(d.content).slice(0, 120) || 'Empty page'}</p>
                  <div className="mt-3 text-[11.5px] text-faint">{timeAgo(d.updatedAt) || 'Just created'}</div>
                </motion.button>
              ))}
            </motion.div>

            <h2 className="mb-3 mt-10 text-[13px] font-medium text-muted">Start from a template</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {TEMPLATES.slice(1).map((t) => (
                <button key={t.label} onClick={() => onNewDoc(t)} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-left text-[13.5px] transition hover:border-accent/40 hover:bg-accent/5">
                  <span className="text-[18px]">{t.icon}</span>{t.label}<ArrowRight size={13} className="ml-auto text-faint" />
                </button>
              ))}
            </div>
          </section>

          {/* In flight */}
          <section aria-label="In flight">
            <h2 className="mb-3 text-[13px] font-medium text-muted">In flight</h2>
            <div className="rounded-2xl border border-line bg-surface">
              {loading && <div className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-8" />)}</div>}
              {!loading && active.length === 0 && (
                <div className="p-6 text-center text-[13px] text-muted"><CheckCircle2 size={20} className="mx-auto mb-2 text-ok" />Nothing in progress.<br /><button onClick={onOpenTasks} className="mt-1 font-medium text-accent hover:underline">Open the sprint board</button></div>
              )}
              {active.map((t, i) => (
                <div key={t.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-line')}>
                  <span className="min-w-0 flex-1 truncate text-[13.5px]">{t.name}</span>
                  <span className="pill"><span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[t.status].dot)} />{t.status}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
