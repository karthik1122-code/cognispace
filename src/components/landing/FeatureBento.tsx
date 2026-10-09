import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Download, Search, ShieldCheck, Undo2 } from 'lucide-react';
import { SpotlightCard, staggerChild, staggerParent } from '../ui/motion';
import { cn } from '../../lib/cn';

/** Types a string out once the element is on screen. Shows the full text under reduced motion. */
export function Typed({ text, speed = 22, className }: { text: string; speed?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (!seen || reduce) return;
    const id = setInterval(() => setN((v) => { if (v >= text.length) { clearInterval(id); return v; } return v + 1; }), speed);
    return () => clearInterval(id);
  }, [seen, reduce, text, speed]);
  return <span ref={ref} className={className} aria-label={text}>{text.slice(0, n)}<span className="ml-px inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-accent" aria-hidden /></span>;
}

function Card({ className, children, label, title, body }: { className?: string; children: ReactNode; label: string; title: string; body: string }) {
  return (
    <motion.div variants={staggerChild} className={className}>
      <SpotlightCard className="card-soft group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:border-accent/40">
        <div className="relative min-h-[200px] flex-1 overflow-hidden border-b border-line bg-fg/[0.025] p-5" aria-hidden>{children}</div>
        <div className="p-6">
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{label}</p>
          <h3 className="text-[18px] font-semibold tracking-tight">{title}</h3>
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{body}</p>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}

function Line({ w, strong }: { w: string; strong?: boolean }) {
  return <span className={cn('block h-2 rounded-full', strong ? 'bg-fg/25' : 'bg-fg/10')} style={{ width: w }} />;
}

function EditorMock() {
  const items = ['Heading 1', 'To-do list', 'Toggle', 'Code block'];
  return (
    <div className="mx-auto max-w-[420px] rounded-xl border border-line bg-surface p-4 shadow-sm">
      <p className="mb-3 text-[17px] font-semibold tracking-tight">Q4 launch plan</p>
      <div className="space-y-2"><Line w="92%" /><Line w="78%" /></div>
      <div className="relative mt-3 flex items-center gap-1 text-[13px] text-muted"><span className="text-accent">/</span>to<span className="inline-block h-3.5 w-[2px] animate-pulse bg-accent" />
        <ul className="absolute left-0 top-7 z-10 w-44 overflow-hidden rounded-lg border border-line bg-elevated p-1 text-[12.5px] shadow-lg">
          {items.map((t, i) => <li key={t} className={cn('rounded-md px-2.5 py-1.5', i === 1 ? 'bg-accent/12 text-fg' : 'text-muted')}>{t}</li>)}
        </ul>
      </div>
      <div className="h-36" />
    </div>
  );
}

function CopilotMock() {
  return (
    <div className="mx-auto max-w-[260px] rounded-xl border border-line bg-surface p-3.5 shadow-sm">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2 py-0.5 text-[11px] font-medium text-accent"><span className="live-dot" /> Copilot</div>
      <p className="min-h-[88px] text-[13px] leading-relaxed text-fg/80"><Typed text="Launch moves to Oct 14. Owners confirmed for docs, billing and the sprint review." /></p>
      <div className="mt-2 flex gap-1.5 text-[11.5px]"><span className="rounded-md bg-accent px-2 py-1 font-medium text-accent-fg">Insert</span><span className="rounded-md border border-line px-2 py-1 text-muted">Stop</span></div>
    </div>
  );
}

function BoardMock() {
  const cols: [string, string[]][] = [['Backlog', ['w-4/5', 'w-3/5']], ['Doing', ['w-full', 'w-2/3']], ['Done', ['w-3/4']]];
  return (
    <div className="mx-auto grid max-w-[300px] grid-cols-3 gap-2">
      {cols.map(([c, cards], ci) => (
        <div key={c} className="rounded-lg bg-fg/[0.04] p-1.5">
          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wide text-faint">{c}</p>
          <div className="space-y-1.5">
            {cards.map((w, i) => <div key={i} className={cn('rounded-md border border-line bg-surface p-1.5 shadow-sm', ci === 1 && i === 0 && '-rotate-2 border-accent/50 shadow-md')}><Line w={w.replace('w-', '').includes('/') ? '80%' : '100%'} strong /><span className="mt-1.5 block"><Line w="45%" /></span></div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryMock() {
  const rows: [string, string, boolean][] = [['Now', 'Current draft', true], ['10:42', 'Autosaved', false], ['Yesterday', 'Before AI insert', false]];
  return (
    <ol className="relative mx-auto max-w-[260px] space-y-2.5 pl-5 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-line">
      {rows.map(([t, d, on]) => (
        <li key={t} className={cn('relative flex items-center justify-between rounded-lg border bg-surface px-3 py-2 text-[12.5px]', on ? 'border-accent/50' : 'border-line')}>
          <span className={cn('absolute -left-[18px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-surface', on ? 'bg-accent' : 'bg-fg/25')} />
          <span><b className="font-medium">{t}</b> <span className="text-muted">· {d}</span></span>
          {!on && <span className="text-[11px] font-medium text-accent">Restore</span>}
        </li>
      ))}
    </ol>
  );
}

function PaletteMock() {
  const rows = ['Q4 launch plan', 'Sprint 12 retro', 'New page', 'Toggle theme'];
  return (
    <div className="mx-auto max-w-[270px] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-[12.5px] text-muted"><Search size={13} /> Search pages and commands <kbd className="kbd ml-auto">⌘K</kbd></div>
      <ul className="p-1 text-[12.5px]">{rows.map((r, i) => <li key={r} className={cn('rounded-md px-2.5 py-1.5', i === 0 ? 'bg-accent/12 text-fg' : 'text-muted')}>{r}</li>)}</ul>
    </div>
  );
}

function Mini({ icon: Icon, children }: { icon: typeof Undo2; children: ReactNode }) {
  return <div className="flex h-full min-h-[96px] items-center justify-center"><span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface text-accent shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><Icon size={24} /></span>{children}</div>;
}

export function FeatureBento() {
  return (
    <motion.div variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="mt-12 grid gap-4 md:grid-cols-6">
      <Card className="md:col-span-4" label="Editor" title="Block editor" body="Type “/” for headings, lists, toggles and code. Select text for a formatting toolbar."><EditorMock /></Card>
      <Card className="md:col-span-2" label="Copilot" title="AI that edits the page" body="Improve, shorten or write from the page you are on. You review before it lands."><CopilotMock /></Card>
      <Card className="md:col-span-2" label="Sprints" title="Sprint board" body="Drag tasks between Backlog, In Progress, In Review and Done."><BoardMock /></Card>
      <Card className="md:col-span-2" label="History" title="Version history" body="Snapshots as you write. Restore any version in one click."><HistoryMock /></Card>
      <Card className="md:col-span-2" label="Speed" title="Command palette" body="Search every page by title or content and run commands."><PaletteMock /></Card>
      <Card className="md:col-span-2" label="Safety" title="Undo everything" body="Take back deletes and AI inserts within seconds."><Mini icon={Undo2}>{null}</Mini></Card>
      <Card className="md:col-span-2" label="Privacy" title="Private by default" body="Per-account data, hashed passwords, rate limits and security headers."><Mini icon={ShieldCheck}>{null}</Mini></Card>
      <Card className="md:col-span-2" label="Ownership" title="Export or delete anytime" body="Download all pages and tasks as JSON, or delete your account and data."><Mini icon={Download}>{null}</Mini></Card>
    </motion.div>
  );
}
