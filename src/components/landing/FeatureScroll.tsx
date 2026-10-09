import { useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface FeatureRow { label: string; title: string; body: string; art: ReactNode }

/** Sticky storytelling: the copy stays put while the product visual changes as you scroll. */
export function FeatureScroll({ rows, onTry }: { rows: FeatureRow[]; onTry: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => setI(Math.min(rows.length - 1, Math.max(0, Math.floor(v * rows.length * 0.999)))));
  const r = rows[i];

  return (
    <>
      {/* Desktop: sticky scroll story */}
      <div ref={ref} className="relative hidden lg:block" style={{ height: `${rows.length * 85}vh` }}>
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto grid w-full max-w-[1200px] grid-cols-2 items-center gap-20 px-5">
            <div>
              <ol className="mb-10 flex gap-2" aria-label="Feature progress">
                {rows.map((x, k) => (
                  <li key={x.label} className="flex-1"><span className={cn('mb-2 block font-mono text-[10.5px] uppercase tracking-[0.1em] transition-colors', k === i ? 'text-accent' : 'text-faint')}>{x.label}</span><span className="block h-1 overflow-hidden rounded-full bg-fg/10"><motion.span className="block h-full bg-accent" initial={false} animate={{ width: k <= i ? '100%' : '0%' }} transition={{ duration: 0.5 }} /></span></li>
                ))}
              </ol>
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                  <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">0{i + 1} · {r.label}</p>
                  <h2 className="max-w-[480px] text-balance text-[44px] font-semibold leading-[1.05] tracking-[-0.045em]">{r.title}</h2>
                  <p className="mt-5 max-w-[460px] text-[17px] leading-relaxed text-muted">{r.body}</p>
                  <button onClick={onTry} className="group mt-7 inline-flex items-center gap-1 text-[14px] font-medium text-fg">Try it <ArrowUpRight size={15} className="text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" /></button>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 -z-10 bg-[radial-gradient(50%_50%_at_50%_50%,rgb(var(--accent)/0.22),transparent)]" />
              <AnimatePresence mode="wait">
                <motion.div key={i} initial={{ opacity: 0, scale: 0.94, rotateX: 8 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="card-soft overflow-hidden rounded-3xl border border-line bg-surface [perspective:1000px]">
                  <div className="flex items-center gap-1.5 border-b border-line bg-fg/[0.03] px-4 py-3" aria-hidden><span className="h-2.5 w-2.5 rounded-full bg-fg/15" /><span className="h-2.5 w-2.5 rounded-full bg-fg/15" /><span className="h-2.5 w-2.5 rounded-full bg-fg/15" /><span className="ml-3 font-mono text-[11px] text-faint">cognispace / {r.label.toLowerCase()}</span></div>
                  <div className="grid min-h-[400px] place-items-center bg-[radial-gradient(60%_70%_at_50%_40%,rgb(var(--accent)/0.10),transparent)] p-8"><div className="w-full origin-center scale-[1.12]">{r.art}</div></div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet: stacked */}
      <div className="lg:hidden">
        {rows.map((x, k) => (
          <section key={x.label} className="border-b border-line">
            <div className="mx-auto grid max-w-[1200px] gap-8 px-5 py-16">
              <div>
                <p className="mb-4 font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent">0{k + 1} · {x.label}</p>
                <h2 className="text-balance text-[30px] font-semibold leading-[1.1] tracking-[-0.04em]">{x.title}</h2>
                <p className="mt-4 text-[16px] leading-relaxed text-muted">{x.body}</p>
                <button onClick={onTry} className={cn('mt-5 inline-flex items-center gap-1 text-[14px] font-medium')}>Try it <ArrowUpRight size={15} className="text-faint" /></button>
              </div>
              <div className="card-soft rounded-2xl border border-line bg-surface p-4">{x.art}</div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
