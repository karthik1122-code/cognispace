import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface PopoverProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  up?: boolean;
  className?: string;
}

/**
 * Tiny menu popover: closes on outside click or Escape, positions under (or over) its trigger.
 * Opening focuses the first item; arrow keys move between items; Escape returns focus to the trigger.
 */
export function Popover({ trigger, children, align = 'left', up = false, className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    items()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLElement>('button')?.focus(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const list = items();
      if (!list.length) return;
      e.preventDefault();
      const at = list.indexOf(document.activeElement as HTMLElement);
      list[(at + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length].focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            'absolute z-50 min-w-[180px] animate-pop-in rounded-xl border border-line-strong bg-elevated p-1 shadow-pop',
            up ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            align === 'right' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ children, onClick, danger, active }: { children: ReactNode; onClick: () => void; danger?: boolean; active?: boolean }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors focus-visible:bg-fg/[0.08] focus-visible:text-fg focus-visible:outline-none',
        danger ? 'text-danger hover:bg-danger/10' : 'text-muted hover:bg-fg/[0.06] hover:text-fg',
        active && 'bg-fg/[0.06] text-fg',
      )}
    >
      {children}
    </button>
  );
}
