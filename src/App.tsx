import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Workspace } from './components/app/Workspace';
import { ServerWakeBanner } from './components/ui/ServerWakeBanner';
import { Logo } from './components/landing/Logo';
import { apiUrl } from './utils/api';
import type { AuthUser } from './lib/types';

export type { AuthUser };
type AppView = 'landing' | 'auth' | 'app';

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem('cognispace_user'); localStorage.removeItem('auth_token'); } catch { /* ignore */ }
}

function Fade({ k, children }: { k: string; children: ReactNode }) {
  return <motion.div key={k} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}>{children}</motion.div>;
}

export function App() {
  const [view, setView] = useState<AppView>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  // Rehydrate the session from the cookie / stored token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = readStorage('auth_token');
        const res = await fetch(apiUrl('/api/auth/me'), {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.user) {
            setUser(data.user);
            setView('app');
          }
        } else if (res.status === 401) {
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

  const logout = useCallback(async () => {
    try { await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' }); } catch { /* cookie expires on its own */ }
    clearSession();
    setUser(null);
    setView('landing');
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center bg-app" role="status" aria-label="Loading">
        <ServerWakeBanner />
        <div className="flex animate-pulse flex-col items-center gap-4"><Logo size={32} /></div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {view === 'landing' && <Fade k="landing"><LandingPage onGetStarted={() => setView('auth')} onLogin={() => setView('auth')} /></Fade>}
      {view === 'auth' && <Fade k="auth"><AuthPage onLoginSuccess={(u) => { setUser(u); setView('app'); }} onBackToLanding={() => setView('landing')} /></Fade>}
      {view === 'app' && <Fade k="app"><Workspace user={user} onLogout={logout} onBackToLanding={() => setView('landing')} /></Fade>}
    </AnimatePresence>
  );
}

export default App;
