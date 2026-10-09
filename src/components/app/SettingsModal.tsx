import { useEffect, useState } from 'react';
import { AlertTriangle, Download, Loader2, Moon, Sun, X } from 'lucide-react';
import { apiUrl } from '../../utils/api';
import { cn } from '../../lib/cn';
import { Avatar } from './Pills';
import type { AuthUser } from '../../lib/types';
import type { Theme } from '../../hooks/useTheme';

interface Props {
  user: AuthUser | null;
  theme: Theme;
  onTheme: (t: Theme) => void;
  getHeaders: () => Record<string, string>;
  onClose: () => void;
  onAccountDeleted: () => void;
  onToast: (message: string, tone?: 'default' | 'error') => void;
}

export function SettingsModal({ user, theme, onTheme, getHeaders, onClose, onAccountDeleted, onToast }: Props) {
  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const exportAll = async () => {
    setExporting(true);
    try {
      const res = await fetch(apiUrl('/api/export'), { headers: getHeaders(), credentials: 'include' });
      if (!res.ok) throw new Error('Export failed');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cognispace-export.json';
      a.click();
      URL.revokeObjectURL(url);
      onToast('Export downloaded');
    } catch {
      onToast('Export failed. Please try again.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/me'), { method: 'DELETE', headers: getHeaders(), credentials: 'include', body: JSON.stringify({ password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Could not delete the account.'); return; }
      onAccountDeleted();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={onClose} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Settings" onMouseDown={(e) => e.stopPropagation()} className="max-h-[90vh] w-[min(520px,100%)] animate-pop-in overflow-y-auto rounded-2xl border border-line-strong bg-elevated shadow-pop">
        <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[15px] font-semibold">Settings</h2>
          <button onClick={onClose} aria-label="Close" className="btn-ghost h-7 w-7 !px-0"><X size={15} /></button>
        </header>

        <div className="space-y-7 p-5">
          <section>
            <h3 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-faint">Account</h3>
            <div className="flex items-center gap-3">
              <Avatar name={user?.name || 'You'} size={40} />
              <div><div className="text-[14px] font-medium">{user?.name}</div><div className="text-[13px] text-muted">{user?.email}</div></div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-faint">Appearance</h3>
            <div className="flex gap-2" role="radiogroup" aria-label="Theme">
              {([['dark', 'Dark', Moon], ['light', 'Light', Sun]] as const).map(([k, label, Icon]) => (
                <button key={k} role="radio" aria-checked={theme === k} onClick={() => onTheme(k)} className={cn('flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border text-[13px]', theme === k ? 'border-accent/60 bg-accent/10 text-fg' : 'border-line text-muted hover:text-fg')}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-faint">Your data</h3>
            <p className="mb-3 text-[13px] text-muted">Download every page and task you own as a single JSON file.</p>
            <button onClick={exportAll} disabled={exporting} className="btn-outline">{exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Export all data</button>
          </section>

          <section className="rounded-xl border border-danger/30 bg-danger/[0.06] p-4">
            <h3 className="mb-1 flex items-center gap-2 text-[13.5px] font-semibold text-danger"><AlertTriangle size={14} /> Delete account</h3>
            <p className="mb-3 text-[13px] text-muted">Permanently deletes your account, pages, version history and tasks. This cannot be undone.</p>
            {!confirming ? (
              <button onClick={() => setConfirming(true)} className="btn border border-danger/40 text-danger hover:bg-danger/10">Delete my account…</button>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); void deleteAccount(); }} className="space-y-3">
                <input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="Enter your password to confirm" className="field" aria-label="Password" autoFocus />
                {error && <p role="alert" className="text-[12.5px] text-danger">{error}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={!password || deleting} className="btn bg-danger text-white hover:brightness-110">{deleting ? <Loader2 size={14} className="animate-spin" /> : null} Permanently delete</button>
                  <button type="button" onClick={() => { setConfirming(false); setPassword(''); setError(''); }} className="btn-ghost">Cancel</button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
