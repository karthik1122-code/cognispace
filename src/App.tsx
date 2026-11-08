import { lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
// Each screen is its own chunk: visitors who only see the landing page never download the editor.
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const Workspace = lazy(() => import('./components/app/Workspace').then(m => ({ default: m.Workspace })));
const SharedPage = lazy(() => import('./pages/SharedPage').then(m => ({ default: m.SharedPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));

// Public share links look like /s/<id>; reset links like /?reset=<token>.
const SHARE_ID = window.location.pathname.match(/^\/s\/([A-Za-z0-9_-]{20,40})\/?$/)?.[1] ?? null;
const RESET_TOKEN = new URLSearchParams(window.location.search).get('reset');
import { ServerWakeBanner } from './components/ui/ServerWakeBanner';
import { Logo } from './components/landing/Logo';
import { apiUrl } from './utils/api';
import type { AuthUser } from './lib/types';

export type { AuthUser };
type AppView = 'landing' | 'auth' | 'app';

// Sessions live only in the httpOnly cookie. Older builds kept a token in localStorage; clear it.
function clearSession() {
  try { localStorage.removeItem('cognispace_user'); localStorage.removeItem('auth_token'); } catch { /* ignore */ }
}

function Fade({ k, children }: { k: string; children: ReactNode }) {
  return <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}>{children}</motion.div>;
}

export function App() {
  if (SHARE_ID) return <Suspense fallback={null}><SharedPage shareId={SHARE_ID} /></Suspense>;
  return <MainApp />;
}

function MainApp() {
  const [resetToken, setResetToken] = useState<string | null>(RESET_TOKEN);
  const [view, setView] = useState<AppView>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  // Rehydrate the session from the cookie / stored token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.user) {
            setUser(data.user);
            setView('app');
          }
        } else {
          clearSession();
        }
      } catch {
        // Server unreachable (e.g. cold start timeout): show the landing page rather than a stale session.
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // "Try the demo": a private sample workspace, signed in with one click. Returns an error message on failure.
  const tryDemo = useCallback(async (): Promise<string | void> => {
    try {
      const res = await fetch(apiUrl('/api/auth/demo'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.user) return data?.error || 'Could not open the demo. Please try again.';
      setUser(data.user);
      setView('app');
    } catch {
      return 'Can’t reach the server. If it was idle, it may be waking up — wait a few seconds and try again.';
    }
  }, []);

  const logout = useCallback(async () => {
    try { await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' }); } catch { /* cookie expires on its own */ }
    clearSession();
    setUser(null);
    setView('landing');
  }, []);

  const leaveReset = () => { setResetToken(null); window.history.replaceState(null, '', '/'); };
  if (resetToken) {
    return (
      <Suspense fallback={null}>
        <ResetPasswordPage token={resetToken} onDone={(u) => { leaveReset(); setUser(u); setView('app'); setChecking(false); }} onCancel={() => { leaveReset(); setAuthMode('login'); setView('auth'); }} />
      </Suspense>
    );
  }

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-app" role="status" aria-label="Loading">
        <ServerWakeBanner />
        <div className="flex animate-pulse flex-col items-center gap-4"><Logo size={32} /></div>
      </div>
    );
  }

  const loading = (
    <div className="grid min-h-screen place-items-center bg-app" role="status" aria-label="Loading">
      <div className="flex animate-pulse flex-col items-center gap-4"><Logo size={32} /></div>
    </div>
  );

  return (
    <Suspense fallback={loading}>
    <AnimatePresence mode="wait" initial={false}>
      {view === 'landing' && <Fade k="landing"><LandingPage onGetStarted={() => { setAuthMode('signup'); setView('auth'); }} onLogin={() => { setAuthMode('login'); setView('auth'); }} onTryDemo={tryDemo} /></Fade>}
      {view === 'auth' && <Fade k="auth"><AuthPage initialMode={authMode} onLoginSuccess={(u) => { setUser(u); setView('app'); }} onBackToLanding={() => setView('landing')} /></Fade>}
      {view === 'app' && <Fade k="app"><Workspace user={user} onLogout={logout} onBackToLanding={() => setView('landing')} /></Fade>}
      {view === 'app' && user?.demo && (
        <div role="status" className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100%-32px)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full border border-line-strong bg-elevated px-4 py-2 text-[13px] text-muted shadow-pop">
          <span>Demo workspace: edit anything, it's deleted after 24 hours.</span>
          <button onClick={() => { void logout().then(() => { setAuthMode('signup'); setView('auth'); }); }} className="font-semibold text-fg underline underline-offset-2">Create your own</button>
        </div>
      )}
    </AnimatePresence>
    </Suspense>
  );
}

export default App;
