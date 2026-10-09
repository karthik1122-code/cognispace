import { useCallback, useEffect, useState } from 'react';
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

  if (view === 'landing') return <LandingPage onGetStarted={() => setView('auth')} onLogin={() => setView('auth')} />;

  if (view === 'auth') {
    return <AuthPage onLoginSuccess={(u) => { setUser(u); setView('app'); }} onBackToLanding={() => setView('landing')} />;
  }

  return <Workspace user={user} onLogout={logout} onBackToLanding={() => setView('landing')} />;
}

export default App;
