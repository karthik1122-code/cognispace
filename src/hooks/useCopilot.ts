import { useCallback, useRef, useState } from 'react';
import { streamAiToEditor } from '../utils/aiStream';
import { sanitizeHtml, stripCodeFences } from '../utils/sanitize';

export function useCopilot() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
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

  const clear = useCallback(() => { setOutput(''); setError(null); setLastPrompt(''); }, []);

  return { output, loading, error, lastPrompt, run, stop, clear };
}
