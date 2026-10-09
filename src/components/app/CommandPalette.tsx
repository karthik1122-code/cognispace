import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CornerDownLeft, FileText, Search } from 'lucide-react';
import { cn } from '../../lib/cn';
import { plainText, type Doc } from '../../lib/types';

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: ReactNode;
  keywords?: string;
  shortcut?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  docs: Doc[];
  actions: PaletteAction[];
  onOpenDoc: (id: string) => void;
}

type Row = { kind: 'action'; action: PaletteAction } | { kind: 'doc'; doc: Doc; snippet: string };

export function CommandPalette({ open, onClose, docs, actions, onOpenDoc }: Props) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setQ(''); setI(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);

  const rows = useMemo<Row[]>(() => {
    const needle = q.trim().toLowerCase();
    const acts = actions.filter((a) => !needle || `${a.label} ${a.keywords ?? ''}`.toLowerCase().includes(needle));
    const hits = docs
      .map((d) => {
        const text = plainText(d.content);
        const inTitle = d.title.toLowerCase().includes(needle);
        const at = needle ? text.toLowerCase().indexOf(needle) : -1;
        return { d, text, inTitle, at };
      })
      .filter((x) => !needle || x.inTitle || x.at >= 0)
      .slice(0, 8)
      .map<Row>((x) => ({ kind: 'doc', doc: x.d, snippet: x.at >= 0 ? `…${x.text.slice(Math.max(0, x.at - 24), x.at + 60)}…` : x.text.slice(0, 70) }));
    return [...acts.map<Row>((a) => ({ kind: 'action', action: a })), ...hits];
  }, [q, docs, actions]);

  useEffect(() => { setI(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [i]);

  if (!open) return null;

  const choose = (row?: Row) => {
    if (!row) return;
    onClose();
    if (row.kind === 'action') row.action.run();
    else onOpenDoc(row.doc.id);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(rows.length - 1, x + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(rows[i]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  let lastKind = '';
  return (
    <div className="fixed inset-0 z-[150] grid place-items-start justify-items-center bg-black/55 px-4 pt-[14vh] backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <div
        role="dialog" aria-modal="true" aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKey}
        className="w-full max-w-[600px] animate-pop-in overflow-hidden rounded-2xl border border-line-strong bg-elevated shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages, or run a command…"
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-faint"
            aria-label="Search"
          />
          <span className="kbd">esc</span>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {rows.length === 0 && <div className="px-4 py-10 text-center text-[13px] text-faint">Nothing matches “{q}”</div>}
          {rows.map((row, idx) => {
            const header = row.kind !== lastKind ? (row.kind === 'action' ? 'Commands' : 'Pages') : null;
            lastKind = row.kind;
            return (
              <div key={row.kind === 'action' ? row.action.id : row.doc.id}>
                {header && <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wider text-faint">{header}</div>}
                <button
                  data-i={idx}
                  onMouseMove={() => setI(idx)}
                  onClick={() => choose(row)}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left', idx === i ? 'bg-accent/12' : '')}
                >
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-md border border-line bg-fg/[0.03] text-muted">
                    {row.kind === 'action' ? row.action.icon : <span className="text-[14px]">{row.doc.icon || <FileText size={14} />}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium">{row.kind === 'action' ? row.action.label : row.doc.title || 'Untitled'}</span>
                    <span className="block truncate text-[12px] text-faint">{row.kind === 'action' ? row.action.hint : row.snippet}</span>
                  </span>
                  {row.kind === 'action' && row.action.shortcut && <span className="kbd">{row.action.shortcut}</span>}
                  {idx === i && row.kind === 'doc' && <CornerDownLeft size={13} className="text-faint" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
