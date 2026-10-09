import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, FileText, History, KanbanSquare, Pause, Play, RotateCcw, Search, Sparkles, Star, Undo2 } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * A scripted, looping walkthrough of the real product flows. It is drawn with
 * React, driven by a single clock, and contains no real user data.
 */

const W = 1000;
const H = 470;

const SCENES = [
  { key: 'write', label: 'Write', hint: 'Type “/” for blocks', ms: 7600 },
  { key: 'copilot', label: 'Copilot', hint: 'AI that edits your page', ms: 8200 },
  { key: 'plan', label: 'Plan', hint: 'Drag tasks across the board', ms: 6800 },
  { key: 'history', label: 'History', hint: 'Restore any version', ms: 7200 },
] as const;
const TOTAL = SCENES.reduce((a, s) => a + s.ms, 0);

const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (n: number) => n * n * (3 - 2 * n);
const typed = (s: string, lt: number, start: number, cps = 28) => s.slice(0, Math.max(0, Math.min(s.length, Math.floor(((lt - start) / 1000) * cps))));
const show = (lt: number, a: number, b = Infinity) => lt >= a && lt < b;

type Pt = [t: number, x: number, y: number];
function along(lt: number, pts: Pt[]): { x: number; y: number } | null {
  if (lt < pts[0][0]) return null;
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, x0, y0] = pts[i], [t1, x1, y1] = pts[i + 1];
    if (lt >= t0 && lt <= t1) { const k = smooth(clamp((lt - t0) / Math.max(1, t1 - t0))); return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k }; }
  }
  const last = pts[pts.length - 1];
  return { x: last[1], y: last[2] };
}

function Caret() { return <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[3px] animate-pulse bg-accent align-baseline" />; }

function Todo({ text, done, flash }: { text: string; done?: boolean; flash?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={cn('flex items-center gap-2.5 rounded-md px-1.5 py-[3px] text-[14px]', flash && 'bg-accent/15')}>
      <span className={cn('grid h-[15px] w-[15px] place-items-center rounded-[4px] border', done ? 'border-accent bg-accent text-white' : 'border-line-strong')}>{done && <Check size={10} strokeWidth={3} />}</span>
      <span className={done ? 'text-faint line-through' : 'text-fg/85'}>{text}</span>
    </motion.div>
  );
}

function Doc({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="px-10 pt-7">
      <div className="mb-1 text-[30px] leading-none">🚀</div>
      <div className="mb-4 text-[27px] font-bold tracking-tight">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

/* ───────────── Scene 1: Write + slash menu ───────────── */
function SceneWrite({ lt }: { lt: number }) {
  const title = typed('Q4 launch plan', lt, 300, 22);
  const l1 = typed('Ship the new onboarding flow', lt, 1300, 32);
  const slashOpen = show(lt, 2700, 4300);
  const sel = lt > 3500 ? 1 : 0;
  const todos = ['Fix the cold-start delay', 'Write release notes', 'Brief the team'];
  const nTodos = lt < 4400 ? 0 : 1 + Math.floor((lt - 4400) / 450);
  return (
    <div className="relative">
      <Doc title={<>{title}{lt < 1300 && <Caret />}</>}>
        {l1 && <p className="text-[14.5px] leading-7 text-fg/85">{l1}{show(lt, 1300, 2600) && <Caret />}</p>}
        {show(lt, 2500, 4400) && <p className="text-[14.5px] leading-7 text-fg/85">{lt < 2700 ? '' : '/'}{lt >= 3000 && lt < 4400 ? 'to' : ''}<Caret /></p>}
        {todos.slice(0, Math.min(3, nTodos)).map((t) => <Todo key={t} text={t} />)}
      </Doc>
      <AnimatePresence>
        {slashOpen && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }} className="absolute left-[60px] top-[196px] w-[250px] rounded-xl border border-line-strong bg-elevated p-1.5 shadow-pop">
            {[['Heading 1', 'Big section title'], ['To-do list', 'Track tasks with checkboxes'], ['Toggle', 'Collapsible section']].map(([t, d], i) => (
              <div key={t} className={cn('flex items-center gap-3 rounded-lg px-2 py-1.5', i === sel && 'bg-accent/15')}>
                <span className="grid h-7 w-7 place-items-center rounded-md border border-line bg-fg/[0.03] text-[11px] text-muted">{i === 0 ? 'H1' : i === 1 ? '☑' : '▸'}</span>
                <span><span className="block text-[12.5px] font-medium">{t}</span><span className="block text-[11px] text-faint">{d}</span></span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── Scene 2: Copilot ───────────── */
const AI_ITEMS = ['Ship the onboarding flow', 'Fix API cold start', 'Write release notes'];
function SceneCopilot({ lt }: { lt: number }) {
  const inserted = lt >= 5000;
  const flash = show(lt, 5000, 6200);
  return (
    <Doc title="Q4 launch plan">
      <p className="text-[14.5px] leading-7 text-fg/85">Ship the new onboarding flow, fix the cold-start delay on the API, and write the release notes before Friday.</p>
      {inserted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-3">
          <div className="mb-1 text-[18px] font-semibold tracking-tight">Action items</div>
          {AI_ITEMS.map((t) => <Todo key={t} text={t} flash={flash} />)}
        </motion.div>
      )}
    </Doc>
  );
}
function CopilotPanel({ lt }: { lt: number }) {
  const prompt = typed('Turn this into an action checklist', lt, 500, 30);
  const sent = lt >= 2000;
  const thinking = show(lt, 2100, 2800);
  const n = lt < 2800 ? 0 : 1 + Math.floor((lt - 2800) / 650);
  const hover = show(lt, 4300, 5000);
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold"><span className="grid h-5 w-5 place-items-center rounded bg-accent/15 text-accent"><Sparkles size={11} /></span>Copilot</div>
      <div className="flex-1 space-y-2.5 overflow-hidden">
        {sent && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="ml-auto w-fit max-w-[88%] rounded-xl rounded-br-sm bg-accent px-3 py-2 text-[12px] text-accent-fg">Turn this into an action checklist</motion.div>}
        {thinking && <div className="flex gap-1 px-1 py-2">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${i * 120}ms` }} />)}</div>}
        {n > 0 && (
          <div className="rounded-xl rounded-bl-sm border border-line bg-fg/[0.04] p-3">
            <div className="space-y-1.5">{AI_ITEMS.slice(0, Math.min(3, n)).map((t) => (
              <motion.div key={t} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 text-[12.5px] text-fg/90"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-accent text-white"><Check size={9} strokeWidth={3} /></span>{t}</motion.div>
            ))}</div>
          </div>
        )}
      </div>
      {n >= 3 && <div className={cn('mt-3 rounded-lg px-3 py-2 text-center text-[12.5px] font-medium transition-all', lt >= 4800 ? 'bg-ok/20 text-ok' : 'bg-accent text-accent-fg', hover && 'scale-[1.03] brightness-110')}>{lt >= 4800 ? '✓ Inserted' : 'Insert into page'}</div>}
      <div className="mt-3 flex h-9 items-center rounded-lg border border-line-strong bg-app px-3 text-[12px] text-muted">{sent ? <span className="text-faint">Ask Copilot…</span> : <>{prompt}<Caret /></>}</div>
    </div>
  );
}

/* ───────────── Scene 3: Board ───────────── */
const COLS = ['Backlog', 'In progress', 'In review', 'Done'];
function SceneBoard({ lt }: { lt: number }) {
  const drag = clamp((lt - 1600) / 2200);
  const dragging = lt >= 1500 && lt < 3900;
  const dropped = lt >= 3900;
  const k = smooth(drag);
  const col = 1 + 2 * k;                       // fractional column index (1 → 3)
  const top = 168 - 26 * Math.sin(k * Math.PI);
  const card = (t: string, tag: string, tone: string, extra?: string) => (
    <div className={cn('rounded-lg border border-line bg-surface p-2.5 text-[12.5px] shadow-sm', extra)}>
      <div className="mb-1.5 font-medium text-fg/90">{t}</div>
      <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', tone)}>{tag}</span>
    </div>
  );
  const done = dropped ? 2 : 1;
  return (
    <div className="relative px-6 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-[22px] font-bold tracking-tight">Sprint 14</div>
        <div className="flex items-center gap-2 text-[12px] text-muted"><span>{done}/6 done</span><span className="h-1.5 w-28 overflow-hidden rounded-full bg-fg/10"><motion.span className="block h-full rounded-full bg-accent" animate={{ width: `${(done / 6) * 100}%` }} transition={{ duration: 0.6 }} /></span></div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {COLS.map((c, i) => (
          <div key={c} className="min-h-[300px] rounded-xl border border-line bg-fg/[0.025] p-2.5">
            <div className="mb-2.5 flex items-center justify-between px-1 text-[12px] font-medium text-muted">{c}<span className="text-faint">{[1, dragging || dropped ? 1 : 2, 1, done][i]}</span></div>
            <div className="space-y-2">
              {i === 0 && card('Write the docs', 'Docs', 'bg-fg/10 text-muted')}
              {i === 1 && card('Fix API cold start', 'Backend', 'bg-warn/15 text-warn')}
              {i === 1 && !dragging && !dropped && card('Polish landing page', 'Design', 'bg-accent/15 text-accent')}
              {i === 1 && dragging && <div className="h-[64px] rounded-lg border border-dashed border-line-strong" />}
              {i === 2 && card('Auth rate limits', 'Security', 'bg-ok/15 text-ok')}
              {i === 3 && card('Ship v1', 'Release', 'bg-ok/15 text-ok', 'opacity-60')}
              {i === 3 && dropped && <motion.div initial={{ scale: 0.92, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }}>{card('Polish landing page', 'Design', 'bg-accent/15 text-accent', 'ring-1 ring-accent/60')}</motion.div>}
            </div>
          </div>
        ))}
      </div>
      {dragging && (
        <div className="pointer-events-none absolute z-10" style={{ width: 'calc((100% - 84px) / 4)', left: `calc(24px + ${col} * ((100% - 36px) / 4))`, top: `${top}px`, transform: `rotate(${(1 - Math.abs(k - 0.5) * 2) * 3}deg) scale(1.04)` }}>
          {card('Polish landing page', 'Design', 'bg-accent/15 text-accent', 'shadow-pop ring-1 ring-accent/60')}
          <svg width="20" height="20" viewBox="0 0 24 24" className="absolute -bottom-3 left-[55%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"><path d="M4 2l15 9-6.5 1.5L9 19z" fill="white" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" /></svg>
        </div>
      )}
    </div>
  );
}

/* ───────────── Scene 4: History ───────────── */
function SceneHistory({ lt }: { lt: number }) {
  const restored = lt >= 3600;
  return (
    <Doc title="Q4 launch plan">
      <motion.div key={String(restored)} initial={{ opacity: 0.2 }} animate={{ opacity: 1 }} className={cn('rounded-lg p-2 transition-colors', restored && lt < 4800 && 'bg-accent/15')}>
        {restored ? (
          <><p className="text-[14.5px] leading-7 text-fg/85">Ship the new onboarding flow.</p><p className="text-[14.5px] leading-7 text-fg/85">Fix the cold-start delay on the API.</p></>
        ) : (
          <><p className="text-[14.5px] leading-7 text-fg/85">Ship onboarding. Everything else slips to Q1.</p><p className="text-[14.5px] leading-7 text-fg/85">(Rewritten — old plan removed.)</p></>
        )}
      </motion.div>
    </Doc>
  );
}
function HistoryPanel({ lt }: { lt: number }) {
  const versions = [['Just now', 'Current'], ['2 min ago', 'Autosaved'], ['Yesterday, 6:40 PM', 'Autosaved']];
  const picked = lt >= 2300 ? 2 : -1;
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold"><History size={14} className="text-accent" /> Version history</div>
      <div className="space-y-1.5">
        {versions.map(([a, b], i) => (
          <div key={a} className={cn('rounded-lg border px-3 py-2 transition-colors', picked === i ? 'border-accent/60 bg-accent/10' : 'border-line')}>
            <div className="text-[12.5px] font-medium">{a}</div><div className="text-[11px] text-faint">{b}</div>
          </div>
        ))}
      </div>
      {lt >= 2500 && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('mt-3 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12.5px] font-medium', lt >= 3600 ? 'bg-ok/20 text-ok' : 'bg-accent text-accent-fg')}>{lt >= 3600 ? <><Check size={13} /> Restored</> : <><RotateCcw size={13} /> Restore this version</>}</motion.div>}
    </div>
  );
}

/* ───────────── Cursor + toast per scene ───────────── */
const CURSOR: Record<number, Pt[]> = {
  1: [[3200, 0.82, 0.55], [4500, 0.87, 0.82], [4900, 0.87, 0.83]],
  3: [[1200, 0.8, 0.45], [2400, 0.86, 0.6], [3500, 0.86, 0.5], [4500, 0.9, 0.84], [5100, 0.88, 0.84]],
};
const CLICKS: Record<number, number[]> = { 1: [4750], 3: [2350, 5000] };

function Toast({ lt, scene }: { lt: number; scene: number }) {
  const msg = scene === 1 && show(lt, 5100, 7600) ? ['Inserted into page', 'Undo'] : scene === 3 && show(lt, 3700, 6800) ? ['Restored. Your previous text is saved in history.', 'Undo'] : scene === 2 && show(lt, 4000, 6000) ? ['Moved to Done', 'Undo'] : null;
  return (
    <AnimatePresence>
      {msg && (
        <motion.div key={msg[0]} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }} className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-line-strong bg-elevated px-4 py-2.5 text-[12.5px] shadow-pop">
          <Check size={14} className="text-ok" />{msg[0]}<span className="flex items-center gap-1 text-accent"><Undo2 size={12} />{msg[1]}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Cursor({ lt, scene }: { lt: number; scene: number }) {
  const pts = CURSOR[scene];
  if (!pts) return null;
  const p = along(lt, pts);
  if (!p) return null;
  const click = (CLICKS[scene] ?? []).find((c) => lt >= c && lt < c + 450);
  return (
    <div className="pointer-events-none absolute z-30" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
      {click !== undefined && <span className="absolute -left-3 -top-3 h-6 w-6 animate-ping rounded-full bg-accent/50" />}
      <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"><path d="M4 2l15 9-6.5 1.5L9 19z" fill="white" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" /></svg>
    </div>
  );
}

/* ───────────── Shell ───────────── */
export function LiveDemo({ onPlayVideo }: { onPlayVideo?: () => void }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [t, setT] = useState(reduce ? SCENES[0].ms + SCENES[1].ms - 800 : 0);
  const [playing, setPlaying] = useState(!reduce);
  const [scale, setScale] = useState(1);
  const wrap = useRef<HTMLDivElement>(null);
  const visible = useRef(true);

  useLayoutEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / W)));
    ro.observe(el); setScale(Math.min(1, el.clientWidth / W));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.1 });
    io.observe(el); return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(64, now - last); last = now;
      if (visible.current && !document.hidden) setT((x) => (x + dt) % TOTAL);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  let acc = 0, scene = 0, lt = 0;
  for (let i = 0; i < SCENES.length; i++) { if (t < acc + SCENES[i].ms) { scene = i; lt = t - acc; break; } acc += SCENES[i].ms; }
  const jump = useCallback((i: number) => { setT(SCENES.slice(0, i).reduce((a, s) => a + s.ms, 0)); }, []);

  const showRight = scene === 1 || scene === 3;
  const pages = ['Q4 launch plan', 'Meeting notes', 'Roadmap', 'Journal'];

  return (
    <div className="mx-auto w-full max-w-[1040px] text-left">
      <div ref={wrap} className="relative w-full" style={{ height: H * scale + 2 }} aria-hidden>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${scale})` }}>
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-line-strong bg-app shadow-[0_40px_120px_-20px_rgb(0_0_0/0.6)]">
            <div className="flex h-10 items-center gap-2 border-b border-line bg-sidebar px-4">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="mx-auto flex h-6 w-64 items-center justify-center gap-1.5 rounded-md bg-fg/[0.05] text-[11px] text-faint"><Search size={11} /> cognispace.app</span>
            </div>
            <div className="flex" style={{ height: H - 40 }}>
              <div className="w-[190px] shrink-0 border-r border-line bg-sidebar p-3">
                <div className="mb-3 flex h-7 items-center gap-2 rounded-md border border-line px-2 text-[11px] text-faint"><Search size={11} /> Search <span className="kbd ml-auto">⌘K</span></div>
                <div className={cn('mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px]', scene === 2 ? 'bg-fg/[0.08] text-fg' : 'text-muted')}><KanbanSquare size={12} /> Sprint board</div>
                <div className="px-2 pb-1 pt-3 text-[10px] uppercase tracking-wider text-faint">Pages</div>
                {pages.map((p, i) => (
                  <div key={p} className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px]', i === 0 && scene !== 2 ? 'bg-fg/[0.08] text-fg' : 'text-muted')}>
                    <FileText size={12} /> {p} {i === 2 && <Star size={10} className="ml-auto fill-warn text-warn" />}
                  </div>
                ))}
              </div>
              <div className="relative min-w-0 flex-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={scene} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full">
                    {scene === 0 && <SceneWrite lt={lt} />}
                    {scene === 1 && <SceneCopilot lt={lt} />}
                    {scene === 2 && <SceneBoard lt={lt} />}
                    {scene === 3 && <SceneHistory lt={lt} />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <motion.div initial={false} animate={{ width: showRight ? 270 : 0, opacity: showRight ? 1 : 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="shrink-0 overflow-hidden border-l border-line bg-sidebar">
                <div className="h-full w-[270px]">{scene === 1 ? <CopilotPanel lt={lt} /> : scene === 3 ? <HistoryPanel lt={lt} /> : null}</div>
              </motion.div>
            </div>
            <Cursor lt={lt} scene={scene} />
            <Toast lt={lt} scene={scene} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause demo' : 'Play demo'} className="grid h-9 w-9 place-items-center rounded-full border border-line-strong bg-fg/[0.03] text-muted transition-colors hover:text-fg">
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        {SCENES.map((s, i) => (
          <button key={s.key} onClick={() => jump(i)} aria-label={`Show ${s.label}`} aria-current={i === scene} className={cn('group relative overflow-hidden rounded-full border px-4 py-2 text-left transition-colors', i === scene ? 'border-accent/50 bg-accent/10 text-fg' : 'border-line text-muted hover:text-fg')}>
            <span className="relative z-10 block text-[13px] font-medium leading-none">{s.label}</span>
            <span className="relative z-10 mt-1 hidden text-[11px] leading-none text-faint sm:block">{s.hint}</span>
            {i === scene && <span className="absolute inset-y-0 left-0 bg-accent/20" style={{ width: `${(lt / s.ms) * 100}%` }} />}
          </button>
        ))}
        {onPlayVideo && <button onClick={onPlayVideo} className="inline-flex h-9 items-center gap-2 rounded-full bg-fg px-4 text-[13px] font-medium text-app transition-transform hover:scale-[1.03]"><Play size={13} className="fill-current" /> Watch the full demo</button>}
      </div>
    </div>
  );
}
