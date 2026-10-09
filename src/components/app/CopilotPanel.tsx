import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Copy, CornerDownLeft, Sparkles, Square, X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  output: string;
  loading: boolean;
  error: string | null;
  lastPrompt: string;
  seedPrompt: string;
  onSeedConsumed: () => void;
  onRun: (prompt: string) => void;
  onStop: () => void;
  onInsert: () => void;
  onCopy: () => void;
}

const SUGGESTIONS = [
  'Summarize this page into key points',
  'Improve the writing and fix grammar',
  'Continue writing from where I stopped',
  'Turn this into an action checklist',
];

export function CopilotPanel(p: Props) {
  const [prompt, setPrompt] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (p.open && p.seedPrompt) { setPrompt(p.seedPrompt); p.onSeedConsumed(); setTimeout(() => ref.current?.focus(), 0); }
    else if (p.open) setTimeout(() => ref.current?.focus(), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.open, p.seedPrompt]);

  useEffect(() => { if (p.loading) outRef.current?.scrollTo({ top: outRef.current.scrollHeight }); }, [p.output, p.loading]);

  if (!p.open) return null;

  const submit = () => {
    const text = prompt.trim();
    if (!text || p.loading) return;
    p.onRun(text);
    setPrompt('');
  };

  return (
    <aside className="flex h-full w-[360px] flex-none animate-fade-up flex-col border-l border-line bg-sidebar max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-[90] max-lg:w-[min(380px,100%)] max-lg:shadow-pop" aria-label="AI Copilot">
      <header className="flex h-12 flex-none items-center gap-2 border-b border-line px-4">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-accent/15 text-accent"><Sparkles size={14} /></span>
        <span className="text-[14px] font-semibold">Copilot</span>
        <button onClick={p.onClose} aria-label="Close Copilot" className="btn-ghost ml-auto h-7 w-7 !px-0"><X size={15} /></button>
      </header>

      <div ref={outRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        {!p.output && !p.loading && !p.error && (
          <div className="animate-fade-up">
            <p className="mb-3 text-[13px] text-muted">Ask Copilot to write, edit or organize this page. It reads the page you have open.</p>
            <div className="space-y-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => p.onRun(s)} className="flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-left text-[13px] text-muted transition hover:border-accent/40 hover:bg-accent/5 hover:text-fg">
                  <Sparkles size={13} className="flex-none text-accent" /> {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {(p.lastPrompt || p.output || p.loading) && (
          <div className="mb-3 rounded-lg bg-fg/[0.05] px-3 py-2 text-[13px] text-muted">{p.lastPrompt}</div>
        )}

        {p.loading && !p.output && (
          <div className="space-y-2" aria-label="Thinking">
            <div className="skeleton h-4 w-[90%]" /><div className="skeleton h-4 w-[75%]" /><div className="skeleton h-4 w-[82%]" />
          </div>
        )}
        {p.output && (
          <div className={cn('doc-editor !min-h-0 text-[14px]', p.loading && 'opacity-90')} dangerouslySetInnerHTML={{ __html: p.output }} />
        )}
        {p.error && (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[13px] text-danger">{p.error}</div>
        )}
      </div>

      {p.output && !p.loading && (
        <div className="flex flex-none gap-2 border-t border-line px-4 py-2.5">
          <button onClick={p.onInsert} className="btn-primary flex-1"><CornerDownLeft size={13} /> Insert into page</button>
          <button onClick={p.onCopy} className="btn-outline" aria-label="Copy"><Copy size={13} /></button>
        </div>
      )}

      <div className="flex-none border-t border-line p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-fg/[0.03] p-2 focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/15">
          <textarea
            ref={ref}
            value={prompt}
            rows={1}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder="Ask Copilot…"
            className="max-h-32 min-h-[28px] flex-1 resize-none bg-transparent px-1 py-1 text-[13.5px] outline-none placeholder:text-faint"
            aria-label="Ask Copilot"
          />
          {p.loading ? (
            <button onClick={p.onStop} aria-label="Stop generating" className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-fg/10 hover:bg-fg/20"><Square size={11} className="fill-current" /></button>
          ) : (
            <button onClick={submit} disabled={!prompt.trim()} aria-label="Send" className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-accent text-accent-fg disabled:opacity-40"><ArrowUp size={15} /></button>
          )}
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-faint">AI can make mistakes. Review before you insert.</p>
      </div>
    </aside>
  );
}
