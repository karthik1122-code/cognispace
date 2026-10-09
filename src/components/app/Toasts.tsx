import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ToastItem {
  id: number;
  message: string;
  tone: 'default' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastApi {
  toast: (message: string, opts?: { tone?: 'default' | 'error'; actionLabel?: string; onAction?: () => void; ms?: number }) => void;
}

const Ctx = createContext<ToastApi>({ toast: () => undefined });
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((p) => p.filter((t) => t.id !== id)), []);

  const toast = useCallback<ToastApi['toast']>((message, opts) => {
    const id = ++seq.current;
    setItems((p) => [...p.slice(-2), { id, message, tone: opts?.tone ?? 'default', actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
    setTimeout(() => dismiss(id), opts?.ms ?? 5000);
  }, [dismiss]);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="flex animate-pop-in items-center gap-3 rounded-xl border border-line-strong bg-elevated py-2 pl-3 pr-2 text-[13px] shadow-pop">
            {t.tone === 'error' ? <AlertCircle size={15} className="text-danger" /> : <CheckCircle2 size={15} className="text-ok" />}
            <span>{t.message}</span>
            {t.actionLabel && t.onAction && (
              <button
                onClick={() => { t.onAction?.(); dismiss(t.id); }}
                className="rounded-md px-2 py-1 text-[12.5px] font-semibold text-accent hover:bg-accent/10"
              >
                {t.actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
