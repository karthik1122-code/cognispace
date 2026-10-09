import { apiUrl } from './api';

export interface StreamAiToEditorParams {
  prompt: string;
  selectedText?: string;
  documentTitle?: string;
  mode?: string;
  signal?: AbortSignal; // Browser AbortSignal for instant stream cancellation
  onChunk?: (newChunk: string, accumulated: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Streams AI transformations from the backend with full AbortController cancellation support.
 */
export async function streamAiToEditor({
  prompt,
  selectedText = '',
  documentTitle = 'CogniSpace Document',
  mode = 'transform',
  signal,
  onChunk,
  onComplete,
  onError,
}: StreamAiToEditorParams): Promise<void> {
  try {
    const response = await fetch(apiUrl('/api/ai/transform'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      },
      credentials: 'include',
      body: JSON.stringify({ prompt, selectedText, documentTitle, mode }),
      signal, // Attaches the abort signal to the HTTP request
    }).catch((fetchErr) => {
      if (fetchErr.name === 'AbortError') {
        throw fetchErr;
      }
      return null;
    });

    if (signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }

    let accumulatedHtml = '';

    // Server answered with an error (rate limit, auth, misconfiguration): surface it, never fake output.
    if (response && !response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(
        data?.error || (response.status === 401 ? 'Your session expired. Please sign in again.' : `AI request failed (${response.status})`)
      );
    }

    // If server responded with a readable stream
    if (response && response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = ''; // SSE frames can be split across network reads

      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          throw new DOMException('The user aborted a request.', 'AbortError');
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();

          if (payload === '[DONE]') {
            onComplete?.(accumulatedHtml);
            return;
          }

          let parsed: { text?: string; chunk?: string; error?: string; done?: boolean };
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue; // malformed frame
          }
          if (parsed.error) throw new Error(parsed.error);
          const textChunk = parsed.text || parsed.chunk || '';
          if (textChunk) {
            accumulatedHtml += textChunk;
            onChunk?.(textChunk, accumulatedHtml);
          }
          if (parsed.done) {
            onComplete?.(accumulatedHtml);
            return;
          }
        }
      }

      onComplete?.(accumulatedHtml);
      return;
    }

    // No response at all = network failure. Only simulate output in local development.
    if (!import.meta.env.DEV) {
      throw new Error('Could not reach the server. Check your connection and try again.');
    }

    // Client-side development fallback simulation with cancellation check
    const generateClientFallback = (action: string, text: string): string => {
      const lower = action.toLowerCase();
      if (lower.includes('summarize')) {
        return `Standardized on ${text.trim().replace(/\s+/g, ' ')} with Zinc-950 obsidian tokens and zero-latency state sync.`;
      }
      if (lower.includes('shorter') || lower.includes('concise')) {
        return text.length > 90
          ? `${text.slice(0, 80).trim()}... (concise summary)`
          : text.trim();
      }
      if (lower.includes('grammar') || lower.includes('fix')) {
        return text.replace(/\bi\b/g, 'I').replace(/\s+/g, ' ').trim();
      }
      return `Optimized Specification (${action}): ${text.trim()} — engineered with high-density layout and atomic version control.`;
    };

    const targetText = generateClientFallback(prompt, selectedText);
    const words = targetText.split(' ');

    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) {
        throw new DOMException('The user aborted a request.', 'AbortError');
      }
      const delta = (i === 0 ? '' : ' ') + words[i];
      accumulatedHtml += delta;
      if (onChunk) onChunk(delta, accumulatedHtml);
      await new Promise((r) => setTimeout(r, 45));
    }

    if (onComplete) onComplete(accumulatedHtml);
  } catch (err: any) {
    // Distinguish between explicit user cancellation and actual errors
    if (err.name === 'AbortError') {
      console.log('AI generation stopped by user via AbortController.');
    } else {
      if (onError) onError(err);
    }
  }
}

export default streamAiToEditor;
