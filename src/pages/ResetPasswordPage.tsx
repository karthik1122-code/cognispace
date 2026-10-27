import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '../utils/api';
import { Logo } from '../components/landing/Logo';
import type { AuthUser } from '../lib/types';

/** Opened from the link in a reset email (/?reset=TOKEN). Sets a new password and signs the user in. */
export function ResetPasswordPage({ token, onDone, onCancel }: { token: string; onDone: (u: AuthUser) => void; onCancel: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true); setError('');
    try {
      const res = await fetch(apiUrl('/api/auth/reset'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ token, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not reset the password.');
      onDone(data.user);
    } catch (err) {
      setError(err instanceof TypeError ? 'Can’t reach the server. Try again in a few seconds.' : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-app px-6 text-fg">
      <form onSubmit={submit} noValidate className="w-full max-w-[380px] space-y-4">
        <Logo />
        <h1 className="pt-4 text-[28px] font-bold tracking-[-0.035em]">Choose a new password</h1>
        <p className="text-[14px] text-muted">This signs you out on every other device.</p>
        <label className="block"><span className="mb-1.5 block text-[12.5px] font-medium text-muted">New password</span>
          <input className="field" type="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} autoFocus /></label>
        <label className="block"><span className="mb-1.5 block text-[12.5px] font-medium text-muted">Type it again</span>
          <input className="field" type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} /></label>
        {error && <div role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-[13px] text-danger">{error}</div>}
        <button type="submit" disabled={busy} className="btn-primary !h-11 w-full !rounded-xl">{busy ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save new password'}</button>
        <button type="button" onClick={onCancel} className="w-full text-center text-[13px] text-muted hover:text-fg">Back to sign in</button>
      </form>
    </div>
  );
}

export default ResetPasswordPage;
