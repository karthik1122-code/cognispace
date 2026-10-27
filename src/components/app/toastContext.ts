import { createContext, useContext } from 'react';

export interface ToastApi {
  toast: (message: string, opts?: { tone?: 'default' | 'error'; actionLabel?: string; onAction?: () => void; ms?: number }) => void;
}

export const ToastContext = createContext<ToastApi>({ toast: () => undefined });
export const useToast = () => useContext(ToastContext);
