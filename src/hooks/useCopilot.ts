import { useCallback, useRef, useState } from 'react';
import { streamAiToEditor, streamAsk } from '../utils/aiStream';
import type { AskSource } from '../lib/types';
import { sanitizeHtml, stripCodeFences } from '../utils/sanitize';

export function useCopilot() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  /** Set for workspace answers: the passages the answer cites as [1], [2]... */
  const [sources, setSources] = useState<AskSource[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  const run = useCallback(async (prompt: string, context: string, title: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setOutput('');
    setSources(null);
    setLastPrompt(prompt);
    let acc = '';
    await streamAiToEditor({
      prompt,
      selectedText: context.slice(0, 6000),
      documentTitle: title,
      mode: 'transform',
      signal: ctrl.signal,
      onChunk: (_c, all) => { acc = all; setOutput(sanitizeHtml(stripCodeFences(all))); },
      onComplete: (full) => { acc = full || acc; setOutput(sanitizeHtml(stripCodeFences(acc))); setLoading(false); abortRef.current = null; },
      onError: (e) => { setError(e.message || 'AI request failed'); setLoading(false); abortRef.current = null; },
    });
    // Aborted streams resolve without callbacks.
    if (ctrl.signal.aborted) setLoading(false);
  }, []);

  /** Asks a question across every page; the answer cites the sources it used. */
  const ask = useCallback(async (question: string) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setOutput('');
    setSources([]);
    setLastPrompt(question);
    await streamAsk({
      question,
      signal: ctrl.signal,
      onSources: (s) => setSources(s),
      onChunk: (all) => setOutput(sanitizeHtml(stripCodeFences(all))),
      onComplete: (all) => { setOutput(sanitizeHtml(stripCodeFences(all))); setLoading(false); abortRef.current = null; },
      onError: (e) => { setError(e.message || 'Request failed'); setLoading(false); abortRef.current = null; },
    });
    if (ctrl.signal.aborted) setLoading(false);
  }, []);

  const clear = useCallback(() => { setOutput(''); setError(null); setLastPrompt(''); setSources(null); }, []);

  return { output, loading, error, lastPrompt, sources, run, ask, stop, clear };
}
