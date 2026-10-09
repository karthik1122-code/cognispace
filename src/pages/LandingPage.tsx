import { ArrowRight, ArrowUpRight, Moon, Sun } from 'lucide-react';
import { Logo } from '../components/landing/Logo';
import { ProductShot } from '../components/landing/ProductShot';
import { BoardIllustration, CopilotIllustration, HistoryIllustration, SlashIllustration } from '../components/landing/Illustrations';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../lib/cn';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const ROWS = [
  {
    fig: 'Fig 0.1', label: 'Editor', title: 'Write at the speed of thought.',
    body: 'Type “/” for headings, to-dos, toggles and code. Everything is a keyboard shortcut away, and autosave only says “Saved” when the server confirms it.',
    art: <SlashIllustration />,
  },
  {
    fig: 'Fig 0.2', label: 'Copilot', title: 'AI that edits the page you are on.',
    body: 'Highlight text to improve or summarize it, or ask Copilot to write from your page. You review the result, insert it, and undo it in one click.',
    art: <CopilotIllustration />,
  },
  {
    fig: 'Fig 0.3', label: 'Sprints', title: 'Plan the work next to the writing.',
    body: 'A drag-and-drop board for Backlog, In Progress, In Review and Done, with a table view when you need to scan and sort.',
    art: <BoardIllustration />,
  },
  {
    fig: 'Fig 0.4', label: 'History', title: 'Nothing you write is ever lost.',
    body: 'Snapshots are saved as you work. Restore an older version in one click, and your current text stays in history in case you change your mind.',
    art: <HistoryIllustration />,
  },
];

const SHIPPED = [
  { tag: 'Reliability', title: 'Saves that tell the truth', body: 'Offline edits retry automatically. If another tab changed the page, you choose which version wins.' },
  { tag: 'Safety', title: 'Undo for deletes and AI inserts', body: 'Delete a page or insert AI text, then take it back within seconds.' },
  { tag: 'Speed', title: 'Command palette', body: 'Search every page by title or content and run commands with ⌘K.' },
];

const SHORTCUTS: [string[], string][] = [
  [['⌘', 'K'], 'Search and commands'],
  [['/'], 'Insert a block'],
  [['⌘', 'J'], 'Open Copilot'],
  [['⌘', 'B'], 'Toggle sidebar'],
];

export function LandingPage({ onGetStarted, onLogin }: Props) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app text-fg">
      {/* Announcement */}
      <a href="#shipped" className="flex h-9 items-center justify-center gap-2 border-b border-line bg-fg/[0.03] text-[12.5px] text-muted transition-colors hover:text-fg">
        <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide text-accent">New</span>
        Version history, undo and honest autosave <ArrowRight size={12} />
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-app/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-6 text-[13.5px] text-muted md:flex" aria-label="Primary">
            <a href="#product" className="transition-colors hover:text-fg">Product</a>
            <a href="#shipped" className="transition-colors hover:text-fg">Shipped</a>
            <a href="#keyboard" className="transition-colors hover:text-fg">Shortcuts</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="btn-ghost">Log in</button>
            <button onClick={onGetStarted} className="btn-primary">Sign up</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative border-b border-line">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(var(--fg)/0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg)/0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(60%_70%_at_50%_0%,#000,transparent)]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(var(--accent)/0.22),transparent)]" />
          <div className="relative mx-auto max-w-[1200px] px-5 pb-24 pt-24 text-center sm:pt-32">
            <h1 className="mx-auto max-w-[900px] animate-fade-up text-balance text-[44px] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-[76px]">
              The workspace for writing and shipping.
              <span className="text-muted"> Notes, docs and sprints, with AI that edits alongside you.</span>
            </h1>
            <div className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-3" style={{ animationDelay: '120ms' }}>
              <button onClick={onGetStarted} className="btn-primary !h-11 !rounded-full !px-6 !text-[14.5px]">Start building <ArrowRight size={15} /></button>
              <button onClick={onLogin} className="btn-outline !h-11 !rounded-full !px-6 !text-[14.5px]">Log in</button>
            </div>
            <p className="mt-5 font-mono text-[11.5px] uppercase tracking-[0.12em] text-faint">Free to try · Private to your account</p>
          </div>
        </section>

        {/* Product */}
        <section id="product" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-20">
            <div className="animate-fade-up"><ProductShot /></div>
            <p className="mt-5 text-center font-mono text-[11.5px] uppercase tracking-[0.12em] text-faint">Fig 0 — Page, Copilot and sidebar</p>
          </div>
        </section>

        {/* Feature rows */}
        {ROWS.map((r, i) => (
          <section key={r.fig} className="border-b border-line">
            <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-20 lg:grid-cols-2 lg:gap-20">
              <div className={cn(i % 2 === 1 && 'lg:order-2')}>
                <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">{r.fig} · {r.label}</p>
                <h2 className="max-w-[460px] text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[40px]">
                  {r.title}
                </h2>
                <p className="mt-4 max-w-[460px] text-[16px] leading-relaxed text-muted">{r.body}</p>
                <button onClick={onGetStarted} className="group mt-6 inline-flex items-center gap-1 text-[14px] font-medium text-fg">
                  Try it <ArrowUpRight size={15} className="text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                </button>
              </div>
              <div className={cn(i % 2 === 1 && 'lg:order-1')}>{r.art}</div>
            </div>
          </section>
        ))}

        {/* Shipped */}
        <section id="shipped" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-20">
            <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">Recently shipped</p>
            <h2 className="mb-10 max-w-[560px] text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[40px]">Small details that make it feel solid.</h2>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
              {SHIPPED.map((s) => (
                <article key={s.title} className="bg-app p-7 transition-colors hover:bg-surface">
                  <span className="mb-10 inline-block font-mono text-[11px] uppercase tracking-[0.12em] text-faint">{s.tag}</span>
                  <h3 className="text-[17px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{s.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Shortcuts */}
        <section id="keyboard" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-20 lg:grid-cols-2">
            <div>
              <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">Keyboard first</p>
              <h2 className="max-w-[460px] text-balance text-[32px] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-[40px]">Learn four shortcuts. Never reach for the mouse.</h2>
            </div>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {SHORTCUTS.map(([keys, d]) => (
                <li key={d} className="flex items-center justify-between px-5 py-4">
                  <span className="text-[15px] text-muted">{d}</span>
                  <span className="flex gap-1">{keys.map((k) => <kbd key={k} className="kbd !h-7 !min-w-[28px] !text-[13px]">{k}</kbd>)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[360px] bg-[radial-gradient(50%_100%_at_50%_100%,rgb(var(--accent)/0.2),transparent)]" />
          <div className="relative mx-auto max-w-[1200px] px-5 py-28 text-center">
            <h2 className="mx-auto max-w-[680px] text-balance text-[38px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[56px]">Start with a blank page.</h2>
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={onGetStarted} className="btn-primary !h-11 !rounded-full !px-6 !text-[14.5px]">Create your workspace <ArrowRight size={15} /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px] text-faint">
          <div className="flex items-center gap-4"><Logo size={20} /><span>Built by Karthik Uppari</span></div>
          <div className="flex items-center gap-1 rounded-full border border-line p-0.5" role="radiogroup" aria-label="Theme">
            {([['light', Sun], ['dark', Moon]] as const).map(([k, Icon]) => (
              <button key={k} role="radio" aria-checked={theme === k} aria-label={`${k} theme`} onClick={() => setTheme(k)} className={cn('grid h-7 w-7 place-items-center rounded-full', theme === k ? 'bg-fg/10 text-fg' : 'hover:text-fg')}>
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
