import { Check } from 'lucide-react';
import { Popover, MenuItem } from '../ui/Popover';
import { cn } from '../../lib/cn';
import { PRIORITIES, STATUSES, type Priority, type Status } from '../../lib/types';
import { PRIORITY_STYLE, STATUS_STYLE } from '../../lib/taskStyles';

/** `compact` shows only the coloured dot (used on board cards, where the column already names the status). */
export function StatusPill({ value, onChange, compact = false }: { value: Status; onChange: (s: Status) => void; compact?: boolean }) {
  const s = STATUS_STYLE[value];
  return (
    <Popover trigger={({ toggle }) => (
      <button onClick={toggle} aria-label={`Status: ${value}. Change status`} className={cn('pill hover:bg-fg/[0.07]', compact && '!px-2')}><span className={cn('h-2 w-2 rounded-full', s.dot)} />{!compact && value}</button>
    )}>
      {(close) => STATUSES.map((st) => (
        <MenuItem key={st} active={st === value} onClick={() => { onChange(st); close(); }}>
          <span className={cn('h-2 w-2 rounded-full', STATUS_STYLE[st].dot)} />
          <span className="flex-1">{st}</span>
          {st === value && <Check size={13} />}
        </MenuItem>
      ))}
    </Popover>
  );
}

export function PriorityPill({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const p = PRIORITY_STYLE[value];
  return (
    <Popover trigger={({ toggle }) => (
      <button onClick={toggle} className="pill hover:bg-fg/[0.07]"><span className={cn('h-3 w-[3px] rounded-full', p.bar)} />{value}</button>
    )}>
      {(close) => PRIORITIES.map((pr) => (
        <MenuItem key={pr} active={pr === value} onClick={() => { onChange(pr); close(); }}>
          <span className={cn('h-3 w-[3px] rounded-full', PRIORITY_STYLE[pr].bar)} />
          <span className="flex-1">{pr}</span>
          {pr === value && <Check size={13} />}
        </MenuItem>
      ))}
    </Popover>
  );
}

export function Avatar({ name, size = 24 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      className="grid flex-none place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, hsl(${hash} 70% 55%), hsl(${(hash + 40) % 360} 70% 42%))` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
