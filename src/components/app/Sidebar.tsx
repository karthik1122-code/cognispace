import { useMemo, useState } from 'react';
import {
  ChevronRight, Home, KanbanSquare, LogOut, Moon, Plus, Search, Settings, Star, Sun, Trash2, FilePlus2, Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Popover, MenuItem } from '../ui/Popover';
import { Avatar } from './Pills';
import { TEMPLATES, type DocTemplate } from '../../hooks/useWorkspace';
import type { AuthUser, Doc } from '../../lib/types';
import type { Theme } from '../../hooks/useTheme';

interface SidebarProps {
  user: AuthUser | null;
  docs: Doc[];
  activeId: string | null;
  view: 'home' | 'page' | 'tasks';
  loading: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onSelectDoc: (id: string) => void;
  onOpenTasks: () => void;
  onOpenHome: () => void;
  onOpenSettings: () => void;
  onNewDoc: (template?: DocTemplate, parentId?: string | null) => void;
  onDeleteDoc: (id: string) => void;
  onToggleStar: (id: string) => void;
  onOpenPalette: () => void;
  onLogout: () => void;
  onHome: () => void;
}

export function Sidebar(p: SidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const roots = useMemo(() => p.docs.filter((d) => !d.parentId), [p.docs]);
  const starred = useMemo(() => p.docs.filter((d) => d.isStarred), [p.docs]);
  const childrenOf = (id: string) => p.docs.filter((d) => d.parentId === id);
  const toggle = (id: string) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const Row = ({ doc, depth }: { doc: Doc; depth: number }) => {
    const kids = childrenOf(doc.id);
    const open = expanded.has(doc.id);
    const active = p.view === 'page' && p.activeId === doc.id;
    return (
      <div>
        <div
          className={cn('group flex h-8 items-center gap-1 rounded-lg pr-1 text-[13.5px] transition-colors', active ? 'bg-fg/[0.08] text-fg' : 'text-muted hover:bg-fg/[0.05] hover:text-fg')}
          style={{ paddingLeft: 6 + depth * 14 }}
        >
          <button
            aria-label={open ? 'Collapse' : 'Expand'}
            onClick={() => toggle(doc.id)}
            className={cn('grid h-5 w-5 flex-none place-items-center rounded text-faint hover:bg-fg/10', kids.length === 0 && 'invisible')}
          >
            <ChevronRight size={13} className={cn('transition-transform', open && 'rotate-90')} />
          </button>
          <button onClick={() => p.onSelectDoc(doc.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span className="flex-none text-[15px] leading-none">{doc.icon || '📄'}</span>
            <span className="truncate">{doc.title || 'Untitled'}</span>
          </button>
          <span className="hidden items-center gap-0.5 group-hover:flex">
            <IconBtn label="Add sub-page" onClick={() => { setExpanded((s) => new Set(s).add(doc.id)); p.onNewDoc(TEMPLATES[0], doc.id); }}><Plus size={13} /></IconBtn>
            <IconBtn label={doc.isStarred ? 'Unstar' : 'Star'} onClick={() => p.onToggleStar(doc.id)}><Star size={13} className={cn(doc.isStarred && 'fill-warn text-warn')} /></IconBtn>
            <IconBtn label="Delete" onClick={() => p.onDeleteDoc(doc.id)}><Trash2 size={13} /></IconBtn>
          </span>
        </div>
        {open && kids.map((k) => <Row key={k.id} doc={k} depth={depth + 1} />)}
      </div>
    );
  };

  return (
    <aside className="flex h-full w-[264px] flex-none flex-col border-r border-line bg-sidebar" aria-label="Workspace navigation">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <button onClick={p.onHome} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-fg/[0.05]">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[#8270ff] to-[#c06bff] shadow-glow">
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none"><path d="M21 11a7 7 0 1 0 0 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><circle cx="21.5" cy="16" r="2.4" fill="#fff" /></svg>
          </span>
          <span className="text-[14px] font-semibold tracking-tight">CogniSpace</span>
        </button>
        <Popover
          align="right"
          trigger={({ toggle: t }) => (
            <button onClick={t} aria-label="New page" className="btn-ghost h-7 w-7 !px-0"><FilePlus2 size={15} /></button>
          )}
        >
          {(close) => (
            <>
              <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-faint">New from template</div>
              {TEMPLATES.map((t) => (
                <MenuItem key={t.label} onClick={() => { p.onNewDoc(t); close(); }}><span className="text-[15px]">{t.icon}</span>{t.label}</MenuItem>
              ))}
            </>
          )}
        </Popover>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={p.onOpenPalette}
          className="flex h-8 w-full items-center gap-2 rounded-lg border border-line bg-fg/[0.03] px-2.5 text-[13px] text-faint transition hover:border-line-strong hover:text-muted"
        >
          <Search size={14} /> <span className="flex-1 text-left">Search or jump to…</span> <span className="kbd">⌘K</span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        <button
          onClick={p.onOpenHome}
          className={cn('flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13.5px] transition-colors', p.view === 'home' ? 'bg-fg/[0.08] text-fg' : 'text-muted hover:bg-fg/[0.05] hover:text-fg')}
        >
          <Home size={15} /> Home
        </button>
        <button
          onClick={p.onOpenTasks}
          className={cn('mb-1 flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-[13.5px] transition-colors', p.view === 'tasks' ? 'bg-fg/[0.08] text-fg' : 'text-muted hover:bg-fg/[0.05] hover:text-fg')}
        >
          <KanbanSquare size={15} /> Sprint board
        </button>

        {starred.length > 0 && (
          <>
            <SectionLabel>Favorites</SectionLabel>
            {starred.map((d) => <Row key={`s-${d.id}`} doc={d} depth={0} />)}
          </>
        )}

        <SectionLabel>Pages</SectionLabel>
        {p.loading && (
          <div className="space-y-2 px-2 pt-1" aria-label="Loading pages">
            {[70, 55, 80, 60].map((w, i) => <div key={i} className="skeleton h-5" style={{ width: `${w}%` }} />)}
          </div>
        )}
        {!p.loading && roots.length === 0 && (
          <button onClick={() => p.onNewDoc()} className="mx-1 mt-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-lg border border-dashed border-line-strong px-3 py-3 text-left text-[13px] text-muted hover:border-accent/50 hover:text-fg">
            <Sparkles size={15} className="text-accent" /> Create your first page
          </button>
        )}
        {roots.map((d) => <Row key={d.id} doc={d} depth={0} />)}
      </nav>

      <div className="border-t border-line p-2">
        <Popover
          up
          trigger={({ toggle: t }) => (
            <button onClick={t} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-fg/[0.05]">
              <Avatar name={p.user?.name || 'You'} size={26} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{p.user?.name || 'You'}</span>
                <span className="block truncate text-[11.5px] text-faint">{p.user?.email}</span>
              </span>
            </button>
          )}
          className="w-[232px]"
        >
          {(close) => (
            <>
              <MenuItem onClick={() => { p.onToggleTheme(); close(); }}>
                {p.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} {p.theme === 'dark' ? 'Light theme' : 'Dark theme'}
              </MenuItem>
              <MenuItem onClick={() => { p.onOpenSettings(); close(); }}><Settings size={14} /> Settings</MenuItem>
              <MenuItem danger onClick={() => { close(); p.onLogout(); }}><LogOut size={14} /> Log out</MenuItem>
            </>
          )}
        </Popover>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-faint">{children}</div>;
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className="grid h-6 w-6 place-items-center rounded-md text-faint hover:bg-fg/10 hover:text-fg">
      {children}
    </button>
  );
}
