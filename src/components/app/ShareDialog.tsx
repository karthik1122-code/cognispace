import { useState } from 'react';
import { Check, Copy, Globe, Loader2, Lock, X } from 'lucide-react';
import { apiUrl } from '../../utils/api';

interface Props {
  docId: string;
  title: string;
  shareId: string | null | undefined;
  onChange: (shareId: string | null) => void;
  onClose: () => void;
}

/** Turns a read-only link on or off for one page. Anyone with the link can read the page; nobody can edit it. */
export function ShareDialog({ docId, title, shareId, onChange, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const link = shareId ? `${window.location.origin}/s/${shareId}` : '';

  const toggle = async (on: boolean) => {
    setBusy(true); setError('');
    try {
      const res = await fetch(apiUrl(`/api/documents/${docId}/share`), { method: on ? 'POST' : 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not change sharing.');
      onChange(data.shareId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change sharing.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setError('Copy is blocked in this browser. Select the link and copy it.'); }
  };

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Share page" onMouseDown={(e) => e.stopPropagation()} className="w-[min(480px,100%)] animate-pop-in rounded-2xl border border-line-strong bg-elevated shadow-pop">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="truncate text-[15px] font-semibold">Share “{title || 'Untitled'}”</h2>
          <button onClick={onClose} aria-label="Close" className="btn-ghost h-7 w-7 !px-0"><X size={15} /></button>
        </header>
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-fg/[0.06]">{shareId ? <Globe size={15} /> : <Lock size={15} />}</span>
            <div className="text-[13.5px]">
              <div className="font-medium">{shareId ? 'Anyone with the link can read this page' : 'Only you can see this page'}</div>
              <div className="text-muted">{shareId ? 'They cannot edit it, see your other pages, or see its history.' : 'Create a read-only link to send to someone.'}</div>
            </div>
          </div>
          {shareId && (
            <div className="flex gap-2">
              <input readOnly value={link} aria-label="Share link" className="field min-w-0 flex-1 font-mono text-[12.5px]" onFocus={(e) => e.currentTarget.select()} />
              <button onClick={copy} className="btn-outline">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button>
            </div>
          )}
          {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
          <div className="flex justify-end">
            {shareId
              ? <button onClick={() => void toggle(false)} disabled={busy} className="btn border border-danger/40 text-danger hover:bg-danger/10">{busy && <Loader2 size={14} className="animate-spin" />} Stop sharing</button>
              : <button onClick={() => void toggle(true)} disabled={busy} className="btn-primary">{busy && <Loader2 size={14} className="animate-spin" />} Create link</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
