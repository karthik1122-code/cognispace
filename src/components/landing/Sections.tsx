import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Command, Undo2 } from 'lucide-react';
import { Typed } from './FeatureBento';
import { cn } from '../../lib/cn';

const EASE = [0.2, 0.7, 0.2, 1] as const;

function Lines({ w = ['90%', '72%'] }: { w?: string[] }) {
  return <div className="space-y-2">{w.map((x, i) => <span key={i} className="block h-2 rounded-full bg-fg/10" style={{ width: x }} />)}</div>;
}

/* ---------- How it works ---------- */
function StepWrite() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <Lines w={['88%', '64%']} />
      <p className="mt-3 text-[13px] text-muted"><span className="text-accent">/</span><Typed text="to-do" speed={140} /></p>
      <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent/10 px-2.5 py-1.5 text-[12.5px]"><span className="grid h-4 w-4 place-items-center rounded border border-accent/60" /> To-do list</div>
    </div>
  );
}
function StepCopilot() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <p className="text-[13px] leading-relaxed"><span className="rounded bg-accent/20 px-0.5">we fixed alot of bugs and made it faster</span></p>
      <div className="mt-2 inline-flex gap-1 rounded-lg border border-line bg-elevated p-0.5 text-[11.5px]"><span className="rounded-md bg-accent px-2 py-1 font-medium text-accent-fg">Improve</span><span className="px-2 py-1 text-muted">Summarize</span></div>
      <p className="mt-2.5 rounded-lg bg-fg/[0.05] p-2.5 text-[12.5px] text-fg/80"><Typed text="We fixed many bugs and made the app noticeably faster." speed={28} /></p>
    </div>
  );
}
function StepShip() {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-surface p-3 shadow-sm">
      {['To do', 'Doing', 'Done'].map((c, i) => (
        <div key={c} className="relative h-[104px] rounded-lg bg-fg/[0.04] p-1.5">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">{c}</p>
          {i === 0 && <span className="block h-7 rounded-md border border-line bg-surface shadow-sm" />}
          {i === 2 && <span className="block h-7 rounded-md border border-ok/40 bg-ok/10" />}
          {i === 0 && <span className="hop absolute left-1.5 top-[26px] h-7 w-[calc(100%-12px)] rounded-md border border-accent/60 bg-accent/10 shadow-md" />}
        </div>
      ))}
    </div>
  );
}

export function HowItWorks({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  const vis = [<StepWrite key="w" />, <StepCopilot key="c" />, <StepShip key="s" />];
  return (
    <div className="relative mt-14">
      <svg aria-hidden className="absolute left-[16%] right-[16%] top-[26px] hidden h-2 w-[68%] md:block" preserveAspectRatio="none" viewBox="0 0 100 2"><line x1="0" y1="1" x2="100" y2="1" stroke="rgb(var(--accent))" strokeOpacity=".5" strokeWidth="2" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" /></svg>
      <ol className="relative grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.li key={s.n} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.65, delay: i * 0.14, ease: EASE }} className="card-soft group rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent/40">
            <span className="relative z-10 mb-6 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-accent font-mono text-[16px] font-semibold text-accent-fg shadow-[0_10px_24px_-8px_rgb(var(--accent)/.7)]">{s.n}</span>
            <div aria-hidden className="mb-6 min-h-[132px] rounded-xl bg-fg/[0.03] p-3">{vis[i]}</div>
            <h3 className="text-[20px] font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/* ---------- Recently shipped ---------- */
function SavedMock() {
  const [saved, setSaved] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => { if (reduce) { setSaved(true); return; } const id = setInterval(() => setSaved((v) => !v), 1700); return () => clearInterval(id); }, [reduce]);
  return (
    <div className="w-full max-w-[250px] rounded-xl border border-line bg-surface p-3.5 shadow-sm">
      <div className="mb-3 flex items-center justify-between"><span className="text-[13px] font-semibold">Roadmap</span>
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors', saved ? 'bg-ok/15 text-ok' : 'bg-warn/15 text-warn')}>{saved ? <Check size={11} /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warn" />}{saved ? 'Saved' : 'Saving…'}</span></div>
      <Lines w={['100%', '82%', '58%']} />
    </div>
  );
}
function UndoMock() {
  return (
    <div className="w-full max-w-[250px]">
      <div className="relative overflow-hidden rounded-xl border border-line bg-elevated p-3 shadow-lg">
        <div className="flex items-center justify-between text-[12.5px]"><span>Page deleted</span><span className="inline-flex items-center gap-1 font-semibold text-accent"><Undo2 size={13} /> Undo</span></div>
        <span className="drain absolute inset-x-0 bottom-0 h-[3px] origin-left bg-accent" />
      </div>
    </div>
  );
}
function PaletteMini() {
  return (
    <div className="w-full max-w-[250px] overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2.5 text-[12px] text-muted"><Command size={13} /> Search… <kbd className="kbd ml-auto">⌘K</kbd></div>
      <ul className="p-1 text-[12px]"><li className="rounded-md bg-accent/12 px-2.5 py-1.5">Q4 launch plan</li><li className="px-2.5 py-1.5 text-muted">New page</li></ul>
    </div>
  );
}

export function Shipped({ items }: { items: { tag: string; title: string; body: string }[] }) {
  const vis: ReactNode[] = [<SavedMock key="s" />, <UndoMock key="u" />, <PaletteMini key="p" />];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((s, i) => (
        <motion.article key={s.title} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }} className="card-soft overflow-hidden rounded-2xl border border-line bg-surface transition-all hover:-translate-y-1 hover:border-accent/40">
          <div aria-hidden className="grid min-h-[170px] place-items-center border-b border-line bg-[radial-gradient(70%_80%_at_50%_30%,rgb(var(--accent)/0.10),transparent)] bg-fg/[0.025] p-5">{vis[i]}</div>
          <div className="p-6">
            <span className="mb-3 inline-block rounded-full bg-accent/12 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{s.tag}</span>
            <h3 className="text-[18px] font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.body}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}

/* ---------- Keyboard first ---------- */
const RESULT: ReactNode[] = [
  <div key="k" className="w-full max-w-[320px] overflow-hidden rounded-xl border border-line bg-surface shadow-md"><div className="flex items-center gap-2 border-b border-line px-3.5 py-3 text-[13px] text-muted"><Command size={14} /> Search pages and commands</div><ul className="p-1.5 text-[13px]"><li className="rounded-md bg-accent/12 px-3 py-2">Q4 launch plan</li><li className="px-3 py-2 text-muted">Sprint 12 retro</li><li className="px-3 py-2 text-muted">Toggle theme</li></ul></div>,
  <div key="s" className="w-full max-w-[320px] rounded-xl border border-line bg-surface p-4 shadow-md"><Lines w={['90%', '60%']} /><ul className="mt-3 w-48 rounded-lg border border-line bg-elevated p-1 text-[12.5px] shadow-lg"><li className="rounded-md bg-accent/12 px-2.5 py-1.5">Heading 1</li><li className="px-2.5 py-1.5 text-muted">To-do list</li><li className="px-2.5 py-1.5 text-muted">Toggle</li></ul></div>,
  <div key="j" className="w-full max-w-[320px] rounded-xl border border-line bg-surface p-4 shadow-md"><div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/12 px-2 py-0.5 text-[11px] font-medium text-accent"><span className="live-dot" /> Copilot</div><p className="text-[13px] leading-relaxed text-fg/80">Ask about this page, or select text to improve it.</p><div className="mt-3 rounded-lg border border-line px-3 py-2 text-[12.5px] text-faint">Ask Copilot…</div></div>,
  <div key="b" className="flex w-full max-w-[320px] overflow-hidden rounded-xl border border-line bg-surface shadow-md"><div className="w-24 space-y-2 border-r border-line bg-sidebar p-3"><Lines w={['100%', '80%', '90%']} /></div><div className="flex-1 p-4"><Lines w={['85%', '60%', '75%']} /></div></div>,
];

export function Shortcuts({ items }: { items: [string[], string][] }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => { if (hold || reduce) return; const id = setInterval(() => setI((v) => (v + 1) % items.length), 2600); return () => clearInterval(id); }, [hold, reduce, items.length]);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]" onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}>
      <ul className="card-soft divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map(([keys, d], k) => (
          <li key={d}>
            <button onClick={() => setI(k)} aria-pressed={i === k} className={cn('group flex w-full items-center justify-between px-6 py-5 text-left transition-colors', i === k ? 'bg-accent/[0.07]' : 'hover:bg-fg/[0.03]')}>
              <span className={cn('text-[16px] transition-colors', i === k ? 'font-medium text-fg' : 'text-muted')}>{d}</span>
              <span className="flex gap-1.5">{keys.map((x) => <kbd key={x} className={cn('kbd !h-9 !min-w-[36px] !rounded-lg !text-[15px] transition-all', i === k ? '-translate-y-0.5 !border-accent/60 !bg-accent !text-accent-fg shadow-[0_3px_0_rgb(var(--accent)/0.45)]' : 'shadow-[0_2px_0_rgb(var(--fg)/0.12)]')}>{x}</kbd>)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div aria-hidden className="card-soft relative grid min-h-[300px] place-items-center overflow-hidden rounded-2xl border border-line bg-fg/[0.025] p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_40%,rgb(var(--accent)/0.12),transparent)]" />
        <motion.div key={i} initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: EASE }} className="relative flex w-full justify-center">{RESULT[i]}</motion.div>
      </div>
    </div>
  );
}
