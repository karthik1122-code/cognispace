import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../utils/api';

export type SyncState = 'saved' | 'saving' | 'retrying' | 'conflict' | 'error';

type Patch = Record<string, unknown>;

interface Options<T> {
  getHeaders: () => Record<string, string>;
  onSaved: (docId: string, doc: T) => void;
  onConflict: (docId: string, current: T) => void;
  delay?: number;
}

const BACKOFF_MS = [1500, 3000, 6000, 12000, 20000];

/**
 * Honest autosave.
 *  - Edits to the same doc are merged into ONE pending patch (title + content never clobber each other).
 *  - Only reports "saved" after the server answered 2xx; network errors retry with backoff.
 *  - Sends the last-seen `version`; a 409 means another tab/device changed the page.
 *  - Saves are serialized per document so responses can't arrive out of order.
 */
export function useDocSync<T extends { version?: number }>({ getHeaders, onSaved, onConflict, delay = 800 }: Options<T>) {
  const [state, setState] = useState<SyncState>('saved');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const pending = useRef<Map<string, Patch>>(new Map());
  const versions = useRef<Map<string, number>>(new Map());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const inflight = useRef<Set<string>>(new Set());
  const attempts = useRef<Map<string, number>>(new Map());
  const cb = useRef({ getHeaders, onSaved, onConflict });
  cb.current = { getHeaders, onSaved, onConflict };

  const recompute = useCallback(() => {
    if (pending.current.size > 0 || inflight.current.size > 0) {
      setState((s) => (s === 'retrying' || s === 'conflict' || s === 'error' ? s : 'saving'));
    }
  }, []);

  const send = useCallback(async (docId: string) => {
    if (inflight.current.has(docId)) return;
    const patch = pending.current.get(docId);
    if (!patch) return;
    pending.current.delete(docId);
    inflight.current.add(docId);

    const touchesText = 'content' in patch || 'title' in patch;
    const body: Patch = { ...patch };
    const v = versions.current.get(docId);
    if (touchesText && typeof v === 'number') body.baseVersion = v;

    let retryScheduled = false;
    const started = performance.now();
    try {
      const res = await fetch(apiUrl(`/api/documents/${docId}`), {
        method: 'PATCH',
        headers: cb.current.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setState('conflict');
        if (data?.current) cb.current.onConflict(docId, data.current as T);
      } else if (res.status >= 500 || res.status === 429) {
        throw new Error(`Server responded ${res.status}`);
      } else if (!res.ok) {
        // 4xx (expired session, validation): retrying will not help.
        setState('error');
      } else {
        const saved = (await res.json()) as T;
        setLatencyMs(Math.round(performance.now() - started));
        if (typeof saved.version === 'number') versions.current.set(docId, saved.version);
        attempts.current.delete(docId);
        cb.current.onSaved(docId, saved);
        setLastSavedAt(new Date());
        if (pending.current.size === 0) setState('saved');
      }
    } catch {
      // Network failure / 5xx: put the patch back (newer edits win) and retry with backoff.
      pending.current.set(docId, { ...patch, ...(pending.current.get(docId) ?? {}) });
      const n = attempts.current.get(docId) ?? 0;
      attempts.current.set(docId, n + 1);
      if (n >= BACKOFF_MS.length) {
        setState('error');
      } else {
        setState('retrying');
        retryScheduled = true;
        timers.current.set(docId, setTimeout(() => { inflight.current.delete(docId); void send(docId); }, BACKOFF_MS[n]));
      }
    } finally {
      if (!retryScheduled) inflight.current.delete(docId);
    }

    // Edits that arrived while this request was in flight.
    if (!retryScheduled && pending.current.has(docId)) void send(docId);
  }, []);

  /** Queue a change. Safe to call on every keystroke. */
  const queue = useCallback((docId: string, patch: Patch) => {
    pending.current.set(docId, { ...(pending.current.get(docId) ?? {}), ...patch });
    setState((s) => (s === 'conflict' ? s : 'saving'));
    const existing = timers.current.get(docId);
    if (existing) clearTimeout(existing);
    timers.current.set(docId, setTimeout(() => { timers.current.delete(docId); void send(docId); }, delay));
    recompute();
  }, [delay, send, recompute]);

  /** Remember the server version when a doc is loaded or replaced. */
  const setVersion = useCallback((docId: string, version?: number) => {
    if (typeof version === 'number') versions.current.set(docId, version);
  }, []);

  /** Retry everything now (manual "Retry" button). */
  const retryNow = useCallback(() => {
    attempts.current.clear();
    for (const id of Array.from(pending.current.keys())) {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      inflight.current.delete(id);
      setState('saving');
      void send(id);
    }
  }, [send]);

  /** Drop unsent edits for a doc (used when the user picks "load their version" after a conflict). */
  const discard = useCallback((docId: string) => {
    pending.current.delete(docId);
    const t = timers.current.get(docId);
    if (t) clearTimeout(t);
    inflight.current.delete(docId);
    attempts.current.delete(docId);
    setState('saved');
  }, []);

  // Warn before closing the tab while edits are unsaved.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (pending.current.size > 0 || inflight.current.size > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  useEffect(() => () => { for (const t of timers.current.values()) clearTimeout(t); }, []);

  return { state, latencyMs, lastSavedAt, queue, setVersion, retryNow, discard };
}
