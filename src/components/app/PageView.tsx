import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Plus, X } from 'lucide-react';
import { Editor } from '../editor/Editor';
import { Popover } from '../ui/Popover';
import { PriorityPill, StatusPill } from './Pills';
import { cn } from '../../lib/cn';
import { plainText, timeAgo, type Doc } from '../../lib/types';

const EMOJI = ['📝', '🚀', '🧠', '📋', '💡', '⚡', '📊', '🛠️', '🎯', '🔒', '🎨', '🌟', '📚', '🔮', '✨', '🧪', '🗺️', '📅', '🔥', '🌱', '🏁', '💬', '📌', '🧩'];
const COVERS = [
  'linear-gradient(120deg,#312e81,#6d28d9 55%,#c026d3)',
  'linear-gradient(120deg,#0c4a6e,#0e7490 55%,#10b981)',
  'linear-gradient(120deg,#7c2d12,#be123c 55%,#f59e0b)',
  'linear-gradient(120deg,#18181b,#3f3f46 55%,#71717a)',
  'linear-gradient(120deg,#1e3a8a,#4338ca 55%,#38bdf8)',
];

interface Props {
  doc: Doc;
  editorKey: string;
  onPatch: (patch: Partial<Doc>) => void;
  onAskAI: (prompt: string) => void;
  onSlashUsed?: () => void;
}

export function PageView({ doc, editorKey, onPatch, onAskAI, onSlashUsed }: Props) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [tag, setTag] = useState('');
  const words = useMemo(() => { const t = plainText(doc.content); return t ? t.split(' ').length : 0; }, [doc.content]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [doc.title, doc.id]);

  // Focus the title of brand-new pages so you can start typing immediately.
  useEffect(() => { if (doc.title === 'Untitled' || doc.title === 'Untitled sub-page') titleRef.current?.select(); }, [doc.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTag = () => {
    const t = tag.trim();
    if (t && !(doc.tags ?? []).includes(t)) onPatch({ tags: [...(doc.tags ?? []), t] });
    setTag('');
  };

  return (
    <div className="h-full overflow-y-auto" data-page-scroll>
      {doc.cover ? (
        <div className="group relative h-[168px] w-full" style={{ background: doc.cover }}>
          <div className="absolute bottom-3 right-4 hidden gap-2 group-hover:flex">
            <Popover align="right" trigger={({ toggle }) => <button onClick={toggle} className="btn-outline !bg-black/40 !text-white backdrop-blur">Change cover</button>}>
              {(close) => (
                <div className="grid grid-cols-5 gap-1.5 p-1.5">
                  {COVERS.map((c) => <button key={c} aria-label="Select cover" onClick={() => { onPatch({ cover: c }); close(); }} className="h-8 w-8 rounded-lg ring-1 ring-line-strong hover:scale-105" style={{ background: c }} />)}
                </div>
              )}
            </Popover>
            <button onClick={() => onPatch({ cover: null })} className="btn-outline !bg-black/40 !text-white backdrop-blur" aria-label="Remove cover"><X size={13} /></button>
          </div>
        </div>
      ) : (
        <div className="h-12" />
      )}

      <div className="mx-auto w-full max-w-[740px] px-6 pb-40 sm:px-10">
        <div className={cn('relative', doc.cover ? '-mt-8' : 'mt-2')}>
          <Popover trigger={({ toggle }) => (
            <button onClick={toggle} aria-label="Change icon" className="grid h-[68px] w-[68px] place-items-center rounded-2xl border border-line bg-elevated text-[40px] shadow-pop transition hover:scale-[1.03]">
              {doc.icon || '📄'}
            </button>
          )}>
            {(close) => (
              <div className="grid w-[248px] grid-cols-8 gap-0.5 p-1.5">
                {EMOJI.map((e) => <button key={e} onClick={() => { onPatch({ icon: e }); close(); }} className="grid h-8 w-8 place-items-center rounded-lg text-[18px] hover:bg-fg/[0.08]">{e}</button>)}
              </div>
            )}
          </Popover>
        </div>

        {!doc.cover && (
          <button onClick={() => onPatch({ cover: COVERS[Math.floor(Math.random() * COVERS.length)] })} className="btn-ghost -ml-2 mt-2 h-7 text-faint"><ImagePlus size={14} /> Add cover</button>
        )}

        <textarea
          ref={titleRef}
          rows={1}
          value={doc.title}
          onChange={(e) => onPatch({ title: e.target.value.replace(/\n/g, ' ') })}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); document.querySelector<HTMLElement>('.doc-editor')?.focus(); } }}
          placeholder="Untitled"
          aria-label="Page title"
          className="mt-3 w-full resize-none overflow-hidden bg-transparent text-[40px] font-bold leading-[1.15] tracking-[-0.035em] outline-none placeholder:text-faint/60"
        />

        <div className="mb-8 mt-2 flex flex-wrap items-center gap-2">
          <StatusPill value={doc.status ?? 'In Progress'} onChange={(status) => onPatch({ status })} />
          <PriorityPill value={doc.priority ?? 'Medium'} onChange={(priority) => onPatch({ priority })} />
          {(doc.tags ?? []).map((t) => (
            <span key={t} className="pill group">
              {t}
              <button aria-label={`Remove ${t}`} onClick={() => onPatch({ tags: (doc.tags ?? []).filter((x) => x !== t) })} className="hidden text-faint hover:text-fg group-hover:block"><X size={11} /></button>
            </span>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); addTag(); }} className="flex items-center">
            <Plus size={12} className="-mr-5 ml-2 text-faint" />
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add tag" aria-label="Add tag" className="h-[22px] w-[84px] rounded-md bg-transparent pl-6 text-[11.5px] outline-none placeholder:text-faint focus:bg-fg/[0.05]" />
          </form>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] text-faint">{words} words · edited {timeAgo(doc.updatedAt) || 'just now'}</span>
        </div>

        <Editor key={editorKey} initialContent={doc.content} onChange={(content) => onPatch({ content })} onAskAI={onAskAI} onSlashUsed={onSlashUsed} />
      </div>
    </div>
  );
}
