import { Check, ChevronRight, Heading1, ListChecks, Sparkles } from 'lucide-react';

/** Small, static product illustrations. They depict real features, not real data. */
const frame = 'overflow-hidden rounded-xl border border-line-strong bg-app shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)]';

export function SlashIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="p-6">
        <div className="mb-3 text-[22px] font-bold tracking-tight">Meeting notes</div>
        <p className="text-[13.5px] text-muted">Agenda for Thursday</p>
        <p className="mt-2 text-[13.5px] text-fg/80">/<span className="text-faint">to</span><span className="ml-px inline-block h-4 w-px translate-y-0.5 animate-pulse bg-accent" /></p>
        <div className="mt-2 w-[250px] rounded-xl border border-line-strong bg-elevated p-1.5 shadow-pop">
          {[
            { i: <ListChecks size={14} />, t: 'To-do list', d: 'Track tasks with checkboxes', s: true },
            { i: <ChevronRight size={14} />, t: 'Toggle', d: 'Collapsible section' },
            { i: <Heading1 size={14} />, t: 'Heading 1', d: 'Big section title' },
          ].map((r) => (
            <div key={r.t} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${r.s ? 'bg-accent/12' : ''}`}>
              <span className="grid h-7 w-7 place-items-center rounded-md border border-line bg-fg/[0.03] text-muted">{r.i}</span>
              <span><span className="block text-[12.5px] font-medium">{r.t}</span><span className="block text-[11px] text-faint">{r.d}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CopilotIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="grid grid-cols-[1fr_190px]">
        <div className="p-5 text-[13px] leading-relaxed text-fg/80">
          <div className="mb-2 text-[18px] font-bold tracking-tight text-fg">Release notes</div>
          <span className="rounded bg-accent/25 px-0.5">we fixed alot of bugs and made the app more faster for everyone</span>
          <div className="mt-3 inline-flex items-center gap-1 rounded-lg border border-line-strong bg-elevated p-1 shadow-pop">
            <span className="flex h-6 items-center gap-1 rounded-md bg-accent/15 px-2 text-[11px] font-semibold text-accent"><Sparkles size={11} /> Improve</span>
            <span className="px-1.5 text-[11px] text-muted">Summarize</span>
          </div>
        </div>
        <div className="border-l border-line bg-sidebar p-3 text-[12px]">
          <div className="mb-2 flex items-center gap-1.5 font-semibold"><Sparkles size={12} className="text-accent" /> Copilot</div>
          <div className="rounded-md bg-fg/[0.05] p-2 text-muted">We fixed many bugs and made the app noticeably faster.</div>
          <div className="mt-2 rounded-md bg-accent px-2 py-1 text-center font-medium text-accent-fg">Insert into page</div>
        </div>
      </div>
    </div>
  );
}

export function BoardIllustration() {
  const cols = [
    { n: 'Backlog', c: 'bg-faint', cards: ['Test Copilot on long pages'] },
    { n: 'In Progress', c: 'bg-warn', cards: ['Fix API cold start', 'Explore the editor'] },
    { n: 'Done', c: 'bg-ok', cards: ['Define scope'] },
  ];
  return (
    <div className={frame} aria-hidden>
      <div className="grid grid-cols-3 gap-2 p-3">
        {cols.map((col) => (
          <div key={col.n} className="rounded-lg border border-line bg-fg/[0.02] p-1.5">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-medium"><span className={`h-1.5 w-1.5 rounded-full ${col.c}`} />{col.n}</div>
            {col.cards.map((t, i) => (
              <div key={t} className={`mb-1.5 rounded-md border border-line bg-surface p-2 text-[11.5px] font-medium ${col.n === 'In Progress' && i === 0 ? 'ring-1 ring-accent/60' : ''}`}>{t}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HistoryIllustration() {
  return (
    <div className={frame} aria-hidden>
      <div className="grid grid-cols-[130px_1fr]">
        <div className="border-r border-line p-2 text-[11.5px]">
          {[['2 min ago', true], ['14 min ago'], ['1 h ago'], ['Yesterday']].map(([t, on]) => (
            <div key={String(t)} className={`mb-0.5 rounded-md px-2 py-1.5 ${on ? 'bg-accent/12 text-fg' : 'text-muted'}`}>{t}</div>
          ))}
        </div>
        <div className="p-4 text-[12.5px] text-fg/80">
          <div className="mb-1 text-[15px] font-semibold text-fg">Roadmap</div>
          <p>Ship onboarding, fix the cold start, write release notes.</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-[11.5px] font-medium text-accent-fg"><Check size={11} /> Restore this version</div>
        </div>
      </div>
    </div>
  );
}
