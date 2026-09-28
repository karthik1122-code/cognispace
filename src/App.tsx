import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { WorkspaceDashboard } from './components/dashboard/WorkspaceDashboard';
import { AuthPage } from './pages/AuthPage';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
}

type AppView = 'landing' | 'auth' | 'dashboard';

export function App() {
  const [view, setView] = useState<AppView>('landing');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // On mount: try to rehydrate from existing cookie/token
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/auth/me', { credentials: 'include', headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUser(data.user);
            localStorage.setItem('cognispace_user', JSON.stringify(data.user));
            setView('dashboard');
            return;
          }
        }
      } catch {
        // Server offline — fall back to localStorage
      }

      // Check localStorage as secondary fallback
      const saved = localStorage.getItem('cognispace_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only rehydrate if it's not the old hard-coded default
          if (parsed?.email && parsed.email !== 'karthik@antigravity.io') {
            setUser(parsed);
            setView('dashboard');
          }
        } catch { /* ignore */ }
      }
      setSessionChecked(true);
    };

    rehydrate();
  }, []);

  const handleLoginSuccess = (userData: AuthUser) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch { /* ignore */ }
    localStorage.removeItem('cognispace_user');
    localStorage.removeItem('auth_token');
    setUser(null);
    setView('landing');
  };

  // Splash while checking session
  if (!sessionChecked && view === 'landing' && !user) {
    return (
      <div className="min-h-screen bg-[#060709] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 animate-pulse" />
          <span className="text-sm text-zinc-500 font-mono">Checking session…</span>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setView('auth')}
        onLogin={() => setView('auth')}
      />
    );
  }

  if (view === 'auth') {
    return (
      <AuthPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setView('landing')}
      />
    );
  }

  return (
    <WorkspaceDashboard
      user={user}
      onLogout={handleLogout}
      onBackToLanding={() => setView('landing')}
    />
  );
}

export default App;
