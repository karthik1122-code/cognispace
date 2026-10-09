import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Reveal, RotatingWords, ScrollProgress, SplitWords, SpotlightCard, staggerChild, staggerParent } from '../components/ui/motion';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, GitBranch, History, KanbanSquare, Moon, Search, ShieldCheck, Sparkles, Sun, Undo2, X, Zap } from 'lucide-react';
import { Logo } from '../components/landing/Logo';
import { LiveDemo } from '../components/landing/LiveDemo';
import { FeatureScroll } from '../components/landing/FeatureScroll';
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

const STACK = ['React 19', 'TypeScript', 'TipTap', 'Gemini', 'Express', 'MongoDB'];

const STEPS = [
  { n: '01', title: 'Write', body: 'Open a page and type “/” to add headings, to-dos, toggles and code.' },
  { n: '02', title: 'Ask Copilot', body: 'Highlight text or describe what you need. Review the result before it lands.' },
  { n: '03', title: 'Ship', body: 'Move tasks across the sprint board and keep every change in version history.' },
];

const FAQ = [
  { q: 'Is CogniSpace free?', a: 'Yes, it is free while in beta. There is no card to enter and nothing to install.' },
  { q: 'Which AI does Copilot use?', a: 'Google Gemini. Requests go through our server, are rate limited, and the result is shown for you to review before anything is inserted.' },
  { q: 'Can I get my data out?', a: 'Yes. Export all of your pages and tasks as JSON from Settings, or delete your account and data in one step.' },
  { q: 'Is it real-time multiplayer?', a: 'Not yet. Today it is a fast single-player workspace with safe autosave and conflict handling. Collaboration is on the roadmap.' },
];

const BENTO = [
  { icon: Zap, title: 'Block editor', body: 'Type “/” for headings, lists, toggles and code. Select text for a formatting toolbar.', span: 'md:col-span-2' },
  { icon: Sparkles, title: 'Copilot', body: 'Improve, shorten or write from the page you are on.', span: '' },
  { icon: KanbanSquare, title: 'Sprint board', body: 'Drag tasks between Backlog, In Progress, In Review and Done.', span: '' },
  { icon: History, title: 'Version history', body: 'Snapshots as you write. Restore any version in one click.', span: '' },
  { icon: Undo2, title: 'Undo everything', body: 'Take back deletes and AI inserts within seconds.', span: '' },
  { icon: Search, title: 'Command palette', body: 'Search every page and run commands with ⌘K.', span: 'md:col-span-2' },
  { icon: ShieldCheck, title: 'Private by default', body: 'Per-account data, hashed passwords, rate limits and security headers.', span: '' },
];

const REPO = 'https://github.com/karthik1122-code/cognispace';

/** Oversized outlined type that slides sideways as you scroll. */
function KineticBand() {
  const { scrollYProgress } = useScroll();
  const x = useSpring(useTransform(scrollYProgress, [0, 1], ['0%', '-38%']), { stiffness: 80, damping: 20 });
  const word = (t: string, solid?: boolean) => <span className={solid ? 'text-gradient-accent' : 'text-outline'}>{t}</span>;
  return (
    <section className="overflow-hidden border-b border-line py-10" aria-hidden>
      <motion.div style={{ x }} className="flex w-max items-center gap-10 whitespace-nowrap text-[clamp(64px,11vw,168px)] font-semibold leading-none tracking-[-0.06em]">
        {[0, 1, 2].map((k) => <span key={k} className="flex items-center gap-10">{word('Write.')}{word('Plan.', true)}{word('Ship.')}<span className="text-accent">✦</span></span>)}
      </motion.div>
    </section>
  );
}

/** Looks for /demo.mp4 in /public. Drop your recorded video there and a "Watch" button appears. */
function useDemoVideo() {
  const [has, setHas] = useState(false);
  useEffect(() => {
    let off = false;
    fetch('/demo.mp4', { method: 'HEAD' }).then((r) => { if (!off && r.ok && (r.headers.get('content-type') || '').startsWith('video')) setHas(true); }).catch(() => {});
    return () => { off = true; };
  }, []);
  return has;
}

export function LandingPage({ onGetStarted, onLogin }: Props) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState<number | null>(0);
  const hasVideo = useDemoVideo();
  const [video, setVideo] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-app text-fg">
      <ScrollProgress />
      <a href="#shipped" className="flex h-9 items-center justify-center gap-2 border-b border-line bg-fg/[0.03] text-[12.5px] text-muted transition-colors hover:text-fg">
        <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide text-accent">New</span>
        Version history, undo and honest autosave <ArrowRight size={12} />
      </a>

      <header className="sticky top-0 z-40 border-b border-line bg-app/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-7 text-[13.5px] text-muted md:flex" aria-label="Primary">
            <a href="#features" className="transition-colors hover:text-fg">Features</a>
            <a href="#how" className="transition-colors hover:text-fg">How it works</a>
            <a href="#shipped" className="transition-colors hover:text-fg">Shipped</a>
            <a href="#faq" className="transition-colors hover:text-fg">FAQ</a>
            <a href={REPO} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-fg">GitHub <ArrowUpRight size={12} /></a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="btn-ghost">Log in</button>
            <button onClick={onGetStarted} className="btn-primary">Sign up</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-line">
          <div className="aurora pointer-events-none absolute inset-x-0 top-0 h-[640px] opacity-80" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgb(var(--fg)/0.04)_1px,transparent_1px),linear-gradient(90deg,rgb(var(--fg)/0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(55%_65%_at_50%_0%,#000,transparent)]" />
          <motion.div variants={staggerParent} initial="hidden" animate="show" className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-20 text-center sm:pt-28">
            <motion.a variants={staggerChild} href={REPO} target="_blank" rel="noreferrer" className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-fg/[0.04] py-1 pl-1 pr-3 text-[12.5px] text-muted backdrop-blur transition-colors hover:text-fg">
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-fg">Open source</span>
              Notes, docs and sprints in one workspace <ArrowRight size={12} />
            </motion.a>
            <motion.h1 variants={staggerChild} className="mx-auto max-w-[980px] text-balance text-[46px] font-semibold leading-[1.0] tracking-[-0.055em] sm:text-[84px]">
              <SplitWords text="Where ideas become" className="text-gradient" />
              <br />
              <RotatingWords words={['shipped work.', 'launch plans.', 'sprint wins.', 'shared docs.']} className="text-gradient-accent" />
            </motion.h1>
            <motion.p variants={staggerChild} className="mx-auto mt-6 max-w-[620px] text-balance text-[17px] leading-relaxed text-muted sm:text-[19px]">
              A fast, keyboard-first workspace with a block editor, an AI Copilot that edits the page you are on, and a sprint board, all in one place.
            </motion.p>
            <motion.div variants={staggerChild} className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button onClick={onGetStarted} className="btn-primary btn-shine !h-12 !rounded-full !px-7 !text-[15px]">Start building free <ArrowRight size={16} /></button>
              <a href={REPO} target="_blank" rel="noreferrer" className="btn-outline !h-12 !rounded-full !px-6 !text-[15px]"><GitBranch size={15} /> Star on GitHub</a>
            </motion.div>
            <motion.ul variants={staggerChild} className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-faint">
              {['Free during beta', 'No card needed', 'Export or delete anytime'].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5"><Check size={13} className="text-ok" />{t}</li>
              ))}
            </motion.ul>

            <motion.div variants={staggerChild} id="product" className="relative mx-auto mt-16 max-w-[1080px] scroll-mt-24">
              <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_30%,rgb(var(--accent)/0.28),transparent)]" />
              <LiveDemo onPlayVideo={hasVideo ? () => setVideo(true) : undefined} />
            </motion.div>
          </motion.div>
        </section>

        {/* Stack strip */}
        <section className="border-b border-line">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-5 py-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Built on a modern stack</p>
            <div className="marquee-wrap w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]">
              <ul className="marquee flex gap-14 text-[17px] font-medium text-muted">
                {[...STACK, ...STACK, ...STACK, ...STACK].map((s, i) => <li key={i} className="whitespace-nowrap">{s}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <KineticBand />

        {/* Bento */}
        <section id="features" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-24">
            <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">Features</p>
            <h2 className="max-w-[640px] text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[48px]">Everything you need to think, plan and ship.</h2>
            <motion.div variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="mt-12 grid gap-4 md:grid-cols-3">
              {BENTO.map(({ icon: Icon, title, body, span }) => (
                <motion.div key={title} variants={staggerChild} className={span}>
                <SpotlightCard className="h-full rounded-2xl border border-line bg-surface p-7 transition-all hover:-translate-y-0.5 hover:border-accent/40">
                  <span className="mb-10 grid h-10 w-10 place-items-center rounded-xl border border-line bg-fg/[0.04] text-accent"><Icon size={18} /></span>
                  <h3 className="text-[18px] font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-[420px] text-[14.5px] leading-relaxed text-muted">{body}</p>
                </SpotlightCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Feature story (sticky scroll) */}
        <section className="border-b border-line"><FeatureScroll rows={ROWS} onTry={onGetStarted} /></section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-24">
            <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">How it works</p>
            <h2 className="max-w-[560px] text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[48px]">From blank page to done in three steps.</h2>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-2xl border border-line bg-surface p-7">
                  <span className="text-gradient-accent font-mono text-[34px] font-semibold tracking-tight">{s.n}</span>
                  <h3 className="mt-6 text-[18px] font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Shipped */}
        <section id="shipped" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto max-w-[1200px] px-5 py-24">
            <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">Recently shipped</p>
            <h2 className="mb-10 max-w-[560px] text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[48px]">Small details that make it feel solid.</h2>
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
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-24 lg:grid-cols-2">
            <div>
              <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">Keyboard first</p>
              <h2 className="max-w-[460px] text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[44px]">Learn four shortcuts. Never reach for the mouse.</h2>
            </div>
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {SHORTCUTS.map(([keys, d]) => (
                <li key={d} className="flex items-center justify-between px-5 py-4">
                  <span className="text-[15px] text-muted">{d}</span>
                  <span className="flex gap-1">{keys.map((k) => <kbd key={k} className="kbd !h-7 !min-w-[28px] !text-[13px]">{k}</kbd>)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-b border-line">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-24 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">FAQ</p>
              <h2 className="max-w-[360px] text-balance text-[34px] font-semibold leading-[1.05] tracking-[-0.045em] sm:text-[44px]">Straight answers.</h2>
            </div>
            <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {FAQ.map((f, i) => (
                <div key={f.q}>
                  <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-[16px] font-medium">
                    {f.q}
                    <ChevronDown size={18} className={cn('shrink-0 text-faint transition-transform', open === i && 'rotate-180 text-fg')} />
                  </button>
                  {open === i && <p className="animate-fade-up px-6 pb-5 text-[14.5px] leading-relaxed text-muted">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden">
          <div className="aurora pointer-events-none absolute inset-x-0 bottom-0 h-[420px] opacity-70" />
          <div className="relative mx-auto max-w-[1200px] px-5 py-32 text-center">
            <h2 className="mx-auto max-w-[760px] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.05em] sm:text-[64px]"><span className="text-gradient">Start with a</span> <span className="text-gradient-accent">blank page.</span></h2>
            <p className="mx-auto mt-5 max-w-[480px] text-[16px] text-muted">Create your workspace in under a minute. Free while in beta.</p>
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={onGetStarted} className="btn-primary !h-12 !rounded-full !px-7 !text-[15px]">Create your workspace <ArrowRight size={16} /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-sidebar">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-[280px] text-[13.5px] leading-relaxed text-muted">The AI workspace for notes, docs and sprints. Built in public by Karthik Uppari.</p>
            <div className="mt-5 flex items-center gap-2">
              <a href={REPO} target="_blank" rel="noreferrer" aria-label="GitHub" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:text-fg"><GitBranch size={16} /></a>
              <a href="https://linkedin.com/in/karthik-uppari-4005a7373" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:text-fg"><span className="text-[13px] font-bold">in</span></a>
            </div>
          </div>
          {([
            ['Product', [['Features', '#features'], ['How it works', '#how'], ['Shipped', '#shipped'], ['Shortcuts', '#keyboard']]],
            ['Resources', [['Source code', REPO], ['Report an issue', REPO + '/issues'], ['Changelog', REPO + '/pulls'], ['FAQ', '#faq']]],
            ['Project', [['MIT license', REPO + '/blob/main/LICENSE'], ['README', REPO + '#readme'], ['Author', 'https://github.com/karthik1122-code']]],
          ] as [string, [string, string][]][]).map(([h, links]) => (
            <div key={h}>
              <h4 className="mb-4 text-[12.5px] font-semibold uppercase tracking-[0.1em] text-fg">{h}</h4>
              <ul className="space-y-2.5 text-[13.5px] text-muted">
                {links.map(([l, href]) => (
                  <li key={l}><a href={href} {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} className="transition-colors hover:text-fg">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-6 text-[12.5px] text-faint">
            <span>© {new Date().getFullYear()} CogniSpace. Released under the MIT license.</span>
            <div className="flex items-center gap-1 rounded-full border border-line p-0.5" role="radiogroup" aria-label="Theme">
              {([['light', Sun], ['dark', Moon]] as const).map(([k, Icon]) => (
                <button key={k} role="radio" aria-checked={theme === k} aria-label={`${k} theme`} onClick={() => setTheme(k)} className={cn('grid h-7 w-7 place-items-center rounded-full', theme === k ? 'bg-fg/10 text-fg' : 'hover:text-fg')}>
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {video && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-5 backdrop-blur-sm" onClick={() => setVideo(false)} role="dialog" aria-modal="true" aria-label="Product demo video">
            <button aria-label="Close video" className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={18} /></button>
            <motion.video initial={{ scale: 0.94 }} animate={{ scale: 1 }} src="/demo.mp4" controls autoPlay playsInline className="max-h-[85vh] w-full max-w-[1100px] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LandingPage;
