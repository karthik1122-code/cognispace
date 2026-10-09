import { useEffect, useState } from 'react';
import { apiUrl } from '../../utils/api';

/**
 * Free-tier hosts sleep after inactivity; the first request can take ~30s.
 * Pings /health on mount and, only if it is slow, tells the user what is happening.
 */
export function ServerWakeBanner() {
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let done = false;
    const slowTimer = setTimeout(() => { if (!done) setWaking(true); }, 2500);
    const ctrl = new AbortController();
    fetch(apiUrl('/health'), { signal: ctrl.signal })
      .catch(() => undefined)
      .finally(() => { done = true; clearTimeout(slowTimer); setWaking(false); });
    return () => { ctrl.abort(); clearTimeout(slowTimer); };
  }, []);

  if (!waking) return null;
  return (
    <div role="status" aria-live="polite" style={{ position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 120, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 10, background: 'rgba(12,14,21,0.95)', border: '1px solid rgba(245,158,11,0.35)', color: '#f3f4f6', fontSize: 12.5, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: '#f59e0b', animation: 'pulse 1.2s ease-in-out infinite' }} />
      Waking up the server — free hosting sleeps when idle. This can take up to 30 seconds.
    </div>
  );
}
