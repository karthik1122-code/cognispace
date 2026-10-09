import { useCallback, useState } from 'react';

export type OnboardingStep = 'page' | 'slash' | 'copilot' | 'task' | 'palette';
type State = { done: OnboardingStep[]; dismissed: boolean };

const KEY = 'cs-onboarding';

function read(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      return { done: Array.isArray(parsed.done) ? parsed.done : [], dismissed: Boolean(parsed.dismissed) };
    }
  } catch { /* storage unavailable or corrupt: start fresh */ }
  return { done: [], dismissed: false };
}

function write(s: State) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Tracks the first-run checklist per browser. Purely a UX nicety, so failures are silent. */
export function useOnboarding() {
  const [state, setState] = useState<State>(read);

  const mark = useCallback((step: OnboardingStep) => {
    setState((s) => {
      if (s.done.includes(step)) return s;
      const next = { ...s, done: [...s.done, step] };
      write(next);
      return next;
    });
  }, []);

  const dismiss = useCallback(() => {
    setState((s) => { const next = { ...s, dismissed: true }; write(next); return next; });
  }, []);

  return { done: state.done, dismissed: state.dismissed, mark, dismiss };
}
