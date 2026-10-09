import { useEffect, useState } from 'react';
import { Check, FileText, KanbanSquare, Search, Sparkles, Star } from 'lucide-react';

const LINES = [
  'Q4 launch plan',
  '• Ship the new onboarding flow',
  '• Fix the cold-start delay on the API',
  '• Write release notes',
];

/** A pure-CSS/React illustration of the product. Nothing here is real data. */
export function ProductShot() {
  const [n, setN] = useState(0);
  const total = LINES.join('\n').length;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(total); return; }
    const t = setInterval(() => setN((x) => (x >= total + 40 ? 0 : x + 1)), 55);
    return () => clearInterval(t);
  }, [total]);

  const typed = LINES.join('\n').slice(0, Math.min(n, total)).split('\n');
  const aiOn = n > total - 6;

  return (
    <div className="relative mx-auto w-full max-w-[1040px]" aria-hidden>
      <div className="absolute -inset-x-10 -top-10 bottom-10 -z-10 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_0%,rgb(var(--accent)/0.35),transparent)] blur-2xl" />
      <div className="overflow-hidden rounded-2xl border border-line-strong bg-app shadow-[0_40px_120px_-20px_rgb(0_0_0/0.6)]">
        <div className="flex h-10 items-center gap-2 border-b border-line bg-sidebar px-4">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" /><span className="h-3 w-3 rounded-full bg-[#febc2e]" /><span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="mx-auto flex h-6 w-64 items-center justify-center gap-1.5 rounded-md bg-fg/[0.05] text-[11px] text-faint"><Search size={11} /> cognispace.app</span>
        </div>
        <div className="grid min-h-[380px] grid-cols-[200px_1fr] max-sm:grid-cols-1 md:grid-cols-[200px_1fr_250px]">
          <div className="border-r border-line bg-sidebar p-3 max-sm:hidden">
            <div className="mb-3 flex h-7 items-center gap-2 rounded-md border border-line px-2 text-[11px] text-faint"><Search size={11} /> Search <span className="kbd ml-auto">⌘K</span></div>
            <div className="mb-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-muted"><KanbanSquare size={12} /> Sprint board</div>
            <div className="px-2 pb-1 pt-3 text-[10px] uppercase tracking-wider text-faint">Pages</div>
            {['Q4 launch plan', 'Meeting notes', 'Roadmap', 'Journal'].map((t, i) => (
              <div key={t} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] ${i === 0 ? 'bg-fg/[0.08] text-fg' : 'text-muted'}`}>
                <FileText size={12} /> {t} {i === 2 && <Star size={10} className="ml-auto fill-warn text-warn" />}
              </div>
            ))}
          </div>
          <div className="p-8">
            <div className="mb-1 text-3xl">🚀</div>
            <div className="mb-4 font-bold tracking-tight" style={{ fontSize: 26 }}>{typed[0] || ' '}<span className="ml-0.5 inline-block h-6 w-[2px] translate-y-1 animate-pulse bg-accent" /></div>
            {typed.slice(1).map((l, i) => <p key={i} className="text-[14px] leading-7 text-fg/80">{l}</p>)}
          </div>
          <div className="border-l border-line bg-sidebar p-4 max-md:hidden">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold"><span className="grid h-5 w-5 place-items-center rounded bg-accent/15 text-accent"><Sparkles size={11} /></span>Copilot</div>
            <div className="mb-3 rounded-lg bg-fg/[0.05] px-3 py-2 text-[12px] text-muted">Turn this into an action checklist</div>
            <div className={`space-y-1.5 text-[12.5px] text-fg/85 transition-opacity duration-500 ${aiOn ? 'opacity-100' : 'opacity-0'}`}>
              {['Ship onboarding flow', 'Fix API cold start', 'Write release notes'].map((t) => (
                <div key={t} className="flex items-center gap-2"><span className="grid h-3.5 w-3.5 place-items-center rounded bg-accent text-white"><Check size={9} /></span>{t}</div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-accent px-3 py-1.5 text-center text-[12px] font-medium text-accent-fg">Insert into page</div>
          </div>
        </div>
      </div>
    </div>
  );
}
