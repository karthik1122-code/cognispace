import { useEffect, useState } from 'react';
import { History, RotateCcw, X } from 'lucide-react';
import { apiUrl } from '../../utils/api';
import { sanitizeHtml } from '../../utils/sanitize';
import { cn } from '../../lib/cn';
import { timeAgo } from '../../lib/types';

interface VersionItem { id: string; title: string; content: string; version: number; createdAt: string }

interface Props {
  docId: string;
  getHeaders: () => Record<string, string>;
  onClose: () => void;
  onRestored: (doc: unknown) => void;
}

export function VersionHistory({ docId, getHeaders, onClose, onRestored }: Props) {
  const [versions, setVersions] = useState<VersionItem[] | null>(null);
  const [selected, setSelected] = useState<VersionItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/documents/${docId}/versions`), { headers: getHeaders(), credentials: 'include' });
        if (!res.ok) throw new Error('Could not load history');
        const data = (await res.json()) as VersionItem[];
        if (cancelled) return;
        setVersions(data);
        setSelected(data[0] ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load history');
      }
    })();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { cancelled = true; window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  const restore = async () => {
    if (!selected) return;
    setRestoring(true);
    try {
      const res = await fetch(apiUrl(`/api/documents/${docId}/versions/${selected.id}/restore`), { method: 'POST', headers: getHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Restore failed');
      onRestored(await res.json());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <div
        role="dialog" aria-modal="true" aria-label="Version history"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-[min(560px,88vh)] w-[min(880px,100%)] animate-pop-in flex-col overflow-hidden rounded-2xl border border-line-strong bg-elevated shadow-pop"
      >
        <header className="flex items-center gap-2 border-b border-line px-4 py-3 text-[14px] font-semibold">
          <History size={15} className="text-accent" /> Version history
          <span className="ml-1 text-[12px] font-normal text-faint">Snapshots are saved automatically while you write</span>
          <button onClick={onClose} aria-label="Close" className="btn-ghost ml-auto h-7 w-7 !px-0"><X size={15} /></button>
        </header>

        <div className="flex min-h-0 flex-1">
          <aside className="w-[220px] flex-none overflow-y-auto border-r border-line p-2">
            {!versions && !error && [0, 1, 2, 3].map((n) => <div key={n} className="skeleton mb-2 h-12" />)}
            {versions?.length === 0 && <p className="p-3 text-[12.5px] text-faint">No snapshots yet. Keep writing — the first one appears after your next save.</p>}
            {versions?.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                className={cn('mb-0.5 block w-full rounded-lg px-3 py-2 text-left', selected?.id === v.id ? 'bg-accent/12' : 'hover:bg-fg/[0.05]')}
              >
                <span className="block text-[13px] font-medium">{timeAgo(v.createdAt)}</span>
                <span className="block truncate text-[11.5px] text-faint">{v.title || 'Untitled'}</span>
              </button>
            ))}
          </aside>
          <section className="min-w-0 flex-1 overflow-y-auto p-6">
            {error && <p className="text-danger">{error}</p>}
            {selected && (
              <>
                <h2 className="mb-3 text-[22px] font-bold tracking-tight">{selected.title || 'Untitled'}</h2>
                <div className="doc-editor" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.content) }} />
              </>
            )}
          </section>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <span className="text-[12px] text-faint">Restoring keeps your current text in history, so you can undo it.</span>
          <span className="flex gap-2">
            <button onClick={onClose} className="btn-outline">Cancel</button>
            <button onClick={restore} disabled={!selected || restoring} className="btn-primary"><RotateCcw size={13} /> {restoring ? 'Restoring…' : 'Restore this version'}</button>
          </span>
        </footer>
      </div>
    </div>
  );
}
