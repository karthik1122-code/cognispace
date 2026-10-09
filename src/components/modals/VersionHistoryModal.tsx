import { useEffect, useState } from 'react';
import { History, RotateCcw, X } from 'lucide-react';
import { apiUrl } from '../../utils/api';
import { sanitizeHtml } from '../../utils/sanitize';

interface VersionItem {
  id: string;
  title: string;
  content: string;
  version: number;
  createdAt: string;
}

interface Props {
  docId: string;
  getHeaders: () => Record<string, string>;
  onClose: () => void;
  onRestored: (doc: unknown) => void;
}

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function VersionHistoryModal({ docId, getHeaders, onClose, onRestored }: Props) {
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
      const res = await fetch(apiUrl(`/api/documents/${docId}/versions/${selected.id}/restore`), {
        method: 'POST', headers: getHeaders(), credentials: 'include',
      });
      if (!res.ok) throw new Error('Restore failed');
      onRestored(await res.json());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed');
      setRestoring(false);
    }
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Version history"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(3,4,8,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(880px, 100%)', height: 'min(560px, 90vh)', display: 'flex', flexDirection: 'column', background: '#0c0e15', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
      >
        <header style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#f3f4f6', fontSize: 13.5, fontWeight: 600 }}>
          <History size={15} color="#6366f1" /> Version history
          <span style={{ marginLeft: 6, fontSize: 11, color: '#64748b', fontWeight: 400 }}>Snapshots are taken automatically while you write</span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: 'auto', background: 'none', border: 0, color: '#9ca3af', cursor: 'pointer' }}><X size={16} /></button>
        </header>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <aside style={{ width: 220, borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', padding: 8 }}>
            {!versions && !error && <p style={{ color: '#64748b', fontSize: 12, padding: 8 }}>Loading…</p>}
            {versions?.length === 0 && <p style={{ color: '#64748b', fontSize: 12, padding: 8 }}>No snapshots yet. Keep writing — the first one appears after your next save.</p>}
            {versions?.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelected(v)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 2, borderRadius: 7, border: 0, cursor: 'pointer', background: selected?.id === v.id ? 'rgba(99,102,241,0.18)' : 'transparent', color: selected?.id === v.id ? '#f3f4f6' : '#9ca3af', fontSize: 12.5 }}
              >
                <div style={{ fontWeight: 500 }}>{timeAgo(v.createdAt)}</div>
                <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title || 'Untitled'}</div>
              </button>
            ))}
          </aside>

          <section style={{ flex: 1, overflowY: 'auto', padding: 20, color: '#d1d5db', fontSize: 14, lineHeight: 1.7 }}>
            {error && <p style={{ color: '#f43f5e' }}>{error}</p>}
            {selected && (
              <>
                <h2 style={{ margin: '0 0 12px', fontSize: 20, color: '#f3f4f6' }}>{selected.title || 'Untitled'}</h2>
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selected.content) }} />
              </>
            )}
          </section>
        </div>

        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={onClose} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#9ca3af', fontSize: 12.5, cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={restore} disabled={!selected || restoring}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: 0, background: '#5b5bd6', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: selected && !restoring ? 'pointer' : 'not-allowed', opacity: selected && !restoring ? 1 : 0.5 }}
          >
            <RotateCcw size={13} /> {restoring ? 'Restoring…' : 'Restore this version'}
          </button>
        </footer>
      </div>
    </div>
  );
}
