import { ArrowRight, Check, Command, History, KanbanSquare, Moon, PenLine, ShieldCheck, Sparkles, Sun, Zap } from 'lucide-react';
import { Logo } from '../components/landing/Logo';
import { ProductShot } from '../components/landing/ProductShot';
import { useTheme } from '../hooks/useTheme';

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const FEATURES = [
  { icon: PenLine, title: 'A block editor that stays out of the way', body: 'Type “/” for headings, to-dos, toggles and code. Keyboard first, with autosave you can trust.' },
  { icon: Sparkles, title: 'Copilot that edits alongside you', body: 'Highlight text to improve or summarize it, or ask Copilot to write from the page you are on. Review, insert, undo.' },
  { icon: KanbanSquare, title: 'A sprint board in the same place', body: 'Drag tasks across Backlog, In Progress, In Review and Done. Switch to a table when you need to scan.' },
  { icon: History, title: 'Version history with one-click restore', body: 'Snapshots are saved as you write. Restoring keeps your current text in history, so nothing is lost.' },
  { icon: ShieldCheck, title: 'Saves that tell the truth', body: 'The status only says “Saved” after the server confirms. Offline? It retries. Edited in another tab? It asks you first.' },
  { icon: Command, title: 'Jump anywhere with ⌘K', body: 'Search every page by title or content, create pages, switch theme and run commands without leaving the keyboard.' },
];

export function LandingPage({ onGetStarted, onLogin }: Props) {
  const { theme, toggle } = useTheme();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app text-fg">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[700px] bg-[linear-gradient(rgb(var(--fg)/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg)/0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_0%,#000,transparent)]" />

      <header className="sticky top-0 z-40 border-b border-line bg-app/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13.5px] text-muted md:flex" aria-label="Primary">
            <a href="#features" className="hover:text-fg">Features</a>
            <a href="#keyboard" className="hover:text-fg">Shortcuts</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} aria-label="Toggle theme" className="btn-ghost h-8 w-8 !px-0">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
            <button onClick={onLogin} className="btn-ghost">Log in</button>
            <button onClick={onGetStarted} className="btn-primary">Get started</button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative mx-auto max-w-[1120px] px-5 pb-20 pt-20 text-center sm:pt-28">
          <a href="#features" className="mx-auto mb-7 inline-flex animate-fade-up items-center gap-2 rounded-full border border-line-strong bg-fg/[0.04] py-1 pl-1 pr-3 text-[12.5px] text-muted hover:text-fg">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-fg">New</span> Version history and honest autosave <ArrowRight size={12} />
          </a>
          <h1 className="mx-auto max-w-[820px] animate-fade-up text-balance text-[44px] font-bold leading-[1.04] tracking-[-0.045em] sm:text-[68px]" style={{ animationDelay: '60ms' }}>
            The calm workspace where <span className="bg-gradient-to-r from-[#8270ff] via-[#b36bff] to-[#ff7ac6] bg-clip-text text-transparent">writing meets shipping</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[580px] animate-fade-up text-balance text-[17px] leading-relaxed text-muted" style={{ animationDelay: '120ms' }}>
            Notes, docs and a sprint board in one fast app, with an AI Copilot that works on the page you have open.
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap items-center justify-center gap-3" style={{ animationDelay: '180ms' }}>
            <button onClick={onGetStarted} className="btn-primary !h-11 !rounded-xl !px-6 !text-[15px]">Start for free <ArrowRight size={16} /></button>
            <button onClick={onLogin} className="btn-outline !h-11 !rounded-xl !px-6 !text-[15px]">Log in</button>
          </div>
          <p className="mt-4 text-[12.5px] text-faint">No credit card. Your pages are private to your account.</p>

          <div className="mt-16 animate-fade-up" style={{ animationDelay: '260ms' }}><ProductShot /></div>
        </section>

        <section id="features" className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-20">
          <div className="mb-12 max-w-[560px]">
            <p className="mb-3 text-[13px] font-medium text-accent">Everything in one place</p>
            <h2 className="text-balance text-[34px] font-bold leading-tight tracking-[-0.035em] sm:text-[42px]">Built for the way you actually work</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="group bg-app p-7 transition-colors hover:bg-surface">
                <span className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-fg/[0.03] text-accent transition group-hover:border-accent/50 group-hover:shadow-glow"><Icon size={18} /></span>
                <h3 className="mb-2 text-[16px] font-semibold tracking-tight">{title}</h3>
                <p className="text-[14px] leading-relaxed text-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="keyboard" className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-16">
          <div className="grid items-center gap-10 rounded-3xl border border-line bg-surface p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <span className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent"><Zap size={14} /> Keyboard first</span>
              <h2 className="text-balance text-[30px] font-bold leading-tight tracking-[-0.03em] sm:text-[36px]">Never reach for the mouse</h2>
              <p className="mt-3 max-w-[420px] text-[15px] leading-relaxed text-muted">Every action is a few keystrokes away. Learn four shortcuts and the rest is discoverable from the command palette.</p>
            </div>
            <ul className="space-y-2.5">
              {[['⌘ K', 'Search pages and run commands'], ['/', 'Insert a block while writing'], ['⌘ J', 'Open Copilot'], ['⌘ B', 'Toggle the sidebar']].map(([k, d]) => (
                <li key={k} className="flex items-center justify-between rounded-xl border border-line bg-app px-4 py-3">
                  <span className="text-[14px] text-muted">{d}</span>
                  <span className="flex gap-1">{k.split(' ').map((x) => <kbd key={x} className="kbd !h-6 !min-w-[24px] !text-[12px]">{x}</kbd>)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-[1120px] px-5 pb-28 pt-12">
          <div className="relative overflow-hidden rounded-3xl border border-line-strong bg-surface px-6 py-16 text-center">
            <div className="absolute inset-0 -z-0 bg-[radial-gradient(50%_80%_at_50%_100%,rgb(var(--accent)/0.28),transparent)]" />
            <h2 className="relative text-balance text-[32px] font-bold tracking-[-0.035em] sm:text-[44px]">Start writing in under a minute</h2>
            <ul className="relative mx-auto mt-5 flex max-w-[560px] flex-wrap justify-center gap-x-5 gap-y-2 text-[13.5px] text-muted">
              {['Free to try', 'Dark and light themes', 'Export any page'].map((t) => <li key={t} className="flex items-center gap-1.5"><Check size={14} className="text-ok" />{t}</li>)}
            </ul>
            <button onClick={onGetStarted} className="btn-primary relative mt-8 !h-11 !rounded-xl !px-7 !text-[15px]">Create your workspace <ArrowRight size={16} /></button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-5 py-8 text-[13px] text-faint">
          <Logo size={20} />
          <span>Built by Karthik Uppari · React, Express, MongoDB, Gemini</span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
