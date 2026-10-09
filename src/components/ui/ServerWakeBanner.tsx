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
    <div role="status" aria-live="polite" className="fixed left-1/2 top-4 z-[300] flex -translate-x-1/2 animate-pop-in items-center gap-2.5 rounded-xl border border-warn/40 bg-elevated px-4 py-2.5 text-[13px] shadow-pop">
      <span className="h-2 w-2 animate-pulse rounded-full bg-warn" />
      Waking up the server — free hosting sleeps when idle. This can take up to 30 seconds.
    </div>
  );
}
