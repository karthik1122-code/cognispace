import { useState } from 'react';
import { motion } from 'framer-motion';
import { staggerChild, staggerParent } from '../components/ui/motion';
import { ArrowLeft, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiUrl } from '../utils/api';
import { Logo } from '../components/landing/Logo';
import { ProductShot } from '../components/landing/ProductShot';
import { cn } from '../lib/cn';
import type { AuthUser } from '../lib/types';

interface Props {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToLanding?: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthPage({ onLoginSuccess, onBackToLanding }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const isLogin = mode === 'login';
  const problems = {
    name: !isLogin && !form.name.trim() ? 'Enter your name' : '',
    email: !EMAIL_RE.test(form.email.trim()) ? 'Enter a valid email address' : '',
    password: isLogin ? (form.password ? '' : 'Enter your password') : form.password.length < 8 ? 'Use at least 8 characters' : '',
  };
  const valid = !problems.name && !problems.email && !problems.password;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(''); };
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!valid || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl(isLogin ? '/api/auth/login' : '/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(isLogin ? { email: form.email, password: form.password } : { name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return; }
      try {
        localStorage.setItem('cognispace_user', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('auth_token', data.token);
      } catch { /* storage blocked: the cookie still authenticates */ }
      onLoginSuccess(data.user);
    } catch {
      setError('Can’t reach the server. If it was idle, it may be waking up — wait a few seconds and try again.');
    } finally {
      setLoading(false);
    }
  };

  const err = (k: 'name' | 'email' | 'password') => (touched[k] && problems[k] ? problems[k] : '');

  return (
    <div className="grid min-h-screen bg-app text-fg lg:grid-cols-[minmax(420px,520px)_1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <button onClick={onBackToLanding} aria-label="Back to home"><Logo /></button>
          <button onClick={onBackToLanding} className="btn-ghost"><ArrowLeft size={14} /> Back</button>
        </div>

        <motion.div key={mode} variants={staggerParent} initial="hidden" animate="show" className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <motion.h1 variants={staggerChild} className="text-[30px] font-bold tracking-[-0.035em]">{isLogin ? 'Welcome back' : 'Create your workspace'}</motion.h1>
          <motion.p variants={staggerChild} className="mb-8 mt-2 text-[14px] text-muted">{isLogin ? 'Log in to pick up where you left off.' : 'Start writing and planning in under a minute.'}</motion.p>

          <motion.form variants={staggerChild} onSubmit={submit} noValidate className="space-y-4">
            {!isLogin && (
              <Field label="Name" error={err('name')}>
                <input className={cn('field', err('name') && '!border-danger/60')} autoComplete="name" value={form.name} onChange={set('name')} onBlur={blur('name')} placeholder="Ada Lovelace" />
              </Field>
            )}
            <Field label="Email" error={err('email')}>
              <input className={cn('field', err('email') && '!border-danger/60')} type="email" autoComplete="email" value={form.email} onChange={set('email')} onBlur={blur('email')} placeholder="you@example.com" />
            </Field>
            <Field label="Password" error={err('password')} hint={!isLogin ? 'At least 8 characters' : undefined}>
              <div className="relative">
                <input
                  className={cn('field pr-10', err('password') && '!border-danger/60')}
                  type={show ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={form.password}
                  onChange={set('password')}
                  onBlur={blur('password')}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-faint hover:text-fg">
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {error && <div key={error} role="alert" className="shake rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-[13px] text-danger">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary !h-11 w-full !rounded-xl !text-[14.5px]">
              {loading ? <><Loader2 size={16} className="animate-spin" /> {isLogin ? 'Logging in…' : 'Creating account…'}</> : isLogin ? 'Log in' : 'Create account'}
            </button>
          </motion.form>

          <motion.p variants={staggerChild} className="mt-6 text-center text-[13.5px] text-muted">
            {isLogin ? 'New to CogniSpace?' : 'Already have an account?'}{' '}
            <button onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(''); setTouched({}); }} className="font-medium text-accent hover:underline">
              {isLogin ? 'Create an account' : 'Log in'}
            </button>
          </motion.p>
        </motion.div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-line bg-sidebar lg:block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_20%,rgb(var(--accent)/0.22),transparent)]" />
        <div className="relative flex h-full flex-col justify-center gap-10 p-12">
          <div className="max-w-[420px]">
            <h2 className="text-gradient text-[32px] font-bold leading-tight tracking-[-0.035em]">Write it. Plan it. <span className="text-gradient-accent">Ship it.</span></h2>
            <ul className="mt-5 space-y-2.5 text-[14px] text-muted">
              {['Block editor with “/” commands', 'Copilot that edits the page you’re on', 'Sprint board and version history'].map((t) => (
                <li key={t} className="flex items-center gap-2.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-accent/15 text-accent"><Check size={12} /></span>{t}</li>
              ))}
            </ul>
          </div>
          <div className="-mr-24 origin-left scale-[0.9]"><ProductShot /></div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-[12.5px] font-medium text-muted">{label}{hint && <span className="font-normal text-faint">{hint}</span>}</span>
      {children}
      {error && <span role="alert" className="mt-1.5 block text-[12px] text-danger">{error}</span>}
    </label>
  );
}

export default AuthPage;
