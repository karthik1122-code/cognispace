import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Check, Download, FilePlus2, History, Home, KanbanSquare, Menu, Moon, MoreHorizontal, PanelLeft, RefreshCw, Search, Settings, Sparkles, Star, Sun, Trash2, WifiOff,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { PageView } from './PageView';
import { TasksView } from './TasksView';
import { HomeView } from './HomeView';
import { SettingsModal } from './SettingsModal';
import { CommandPalette, type PaletteAction } from './CommandPalette';
import { CopilotPanel } from './CopilotPanel';
import { VersionHistory } from './VersionHistory';
import { ToastProvider, useToast } from './Toasts';
import { Popover, MenuItem } from '../ui/Popover';
import { ServerWakeBanner } from '../ui/ServerWakeBanner';
import { useTheme } from '../../hooks/useTheme';
import { useWorkspace, TEMPLATES } from '../../hooks/useWorkspace';
import { useCopilot } from '../../hooks/useCopilot';
import { useOnboarding } from '../../hooks/useOnboarding';
import { sanitizeHtml } from '../../utils/sanitize';
import { cn } from '../../lib/cn';
import { plainText, type AuthUser } from '../../lib/types';
import type { SyncState } from '../../hooks/useDocSync';

interface Props {
  user: AuthUser | null;
  onLogout: () => void;
  onBackToLanding: () => void;
}

export function Workspace(props: Props) {
  return (
    <ToastProvider>
      <WorkspaceInner {...props} />
    </ToastProvider>
  );
}

function useIsMobile() {
  const [m, setM] = useState(() => window.matchMedia('(max-width: 820px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 820px)');
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

const SYNC_UI: Record<SyncState, { label: string; tone: string; icon: 'ok' | 'spin' | 'warn' | 'off' }> = {
  saved: { label: 'Saved', tone: 'text-faint', icon: 'ok' },
  saving: { label: 'Saving…', tone: 'text-muted', icon: 'spin' },
  retrying: { label: 'Offline — retrying', tone: 'text-warn', icon: 'off' },
  conflict: { label: 'Edited elsewhere', tone: 'text-danger', icon: 'warn' },
  error: { label: 'Not saved', tone: 'text-danger', icon: 'warn' },
};

function WorkspaceInner({ user, onLogout, onBackToLanding }: Props) {
  const { toast } = useToast();
  const { theme, toggle: toggleTheme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const ws = useWorkspace({
    onUnauthorized: onLogout,
    onError: (m) => toast(m, { tone: 'error' }),
  });
  const ai = useCopilot();
  const onboarding = useOnboarding();

  const [view, setView] = useState<'home' | 'page' | 'tasks'>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => !window.matchMedia('(max-width: 820px)').matches);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [seedPrompt, setSeedPrompt] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  const { active, docs } = ws;
  const editorKey = `${active?.id ?? 'none'}-${nonce}`;

  // ── Actions ───────────────────────────────────────────────────────────
  const openDoc = useCallback((id: string) => { ws.setActiveId(id); setView('page'); if (isMobile) setSidebarOpen(false); }, [ws, isMobile]);

  const newDoc = useCallback(async (template = TEMPLATES[0], parentId: string | null = null) => {
    const created = await ws.createDoc(template, parentId);
    if (created) { setView('page'); onboarding.mark('page'); if (isMobile) setSidebarOpen(false); }
  }, [ws, isMobile, onboarding]);

  const removeDoc = useCallback((id: string) => {
    const title = docs.find((d) => d.id === id)?.title || 'Untitled';
    const undo = ws.deleteDoc(id);
    toast(`Deleted “${title}”`, { actionLabel: 'Undo', onAction: undo, ms: 6000 });
  }, [ws, docs, toast]);

  const toggleStar = useCallback((id: string) => {
    const d = docs.find((x) => x.id === id);
    if (d) ws.patchDoc(id, { isStarred: !d.isStarred });
  }, [ws, docs]);

  const exportDoc = useCallback(() => {
    if (!active) return;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = `<!doctype html><meta charset="utf-8"><title>${esc(active.title)}</title><body style="font-family:system-ui,sans-serif;max-width:720px;margin:48px auto;line-height:1.7;padding:0 16px"><h1>${esc(active.title)}</h1>${sanitizeHtml(active.content)}</body>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.title.replace(/[^\w\- ]+/g, '').trim() || 'page'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported as HTML');
  }, [active, toast]);

  const openCopilot = useCallback((prompt = '') => {
    if (prompt) setSeedPrompt(prompt);
    setCopilotOpen(true);
  }, []);

  const runAi = useCallback((prompt: string) => {
    onboarding.mark('copilot');
    void ai.run(prompt, active ? plainText(active.content) : '', active?.title ?? '');
  }, [ai, active, onboarding]);

  const insertAi = useCallback(() => {
    if (!active || !ai.output) return;
    const before = active.content;
    ws.patchDoc(active.id, { content: before + ai.output });
    setNonce((n) => n + 1);
    toast('Inserted into the page', {
      actionLabel: 'Undo',
      ms: 8000,
      onAction: () => { ws.patchDoc(active.id, { content: before }); setNonce((n) => n + 1); },
    });
  }, [active, ai.output, ws, toast]);

  const copyAi = useCallback(async () => {
    try { await navigator.clipboard.writeText(plainText(ai.output)); toast('Copied'); } catch { toast('Copy failed', { tone: 'error' }); }
  }, [ai.output, toast]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); onboarding.mark('palette'); }
      else if (k === 'b') { e.preventDefault(); setSidebarOpen((o) => !o); }
      else if (k === 'j') { e.preventDefault(); setCopilotOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onboarding]);

  const actions = useMemo<PaletteAction[]>(() => [
    { id: 'new', label: 'New page', hint: 'Create a blank page', icon: <FilePlus2 size={14} />, keywords: 'create add', run: () => void newDoc() },
    ...TEMPLATES.slice(1).map<PaletteAction>((t) => ({ id: `tpl-${t.label}`, label: `New ${t.label.toLowerCase()}`, hint: 'From template', icon: <span>{t.icon}</span>, keywords: 'template create', run: () => void newDoc(t) })),
    { id: 'ai', label: 'Ask Copilot', hint: 'Write or edit with AI', icon: <Sparkles size={14} />, shortcut: '⌘J', keywords: 'ai gemini write', run: () => openCopilot() },
    { id: 'home', label: 'Go to Home', icon: <Home size={14} />, run: () => setView('home') },
    { id: 'settings', label: 'Open settings', hint: 'Account, theme, export, delete', icon: <Settings size={14} />, run: () => setSettingsOpen(true) },
    { id: 'board', label: 'Open sprint board', icon: <KanbanSquare size={14} />, keywords: 'tasks kanban', run: () => setView('tasks') },
    ...(active ? [
      { id: 'history', label: 'Version history', hint: 'Browse and restore earlier versions', icon: <History size={14} />, run: () => setHistoryOpen(true) },
      { id: 'export', label: 'Export page as HTML', icon: <Download size={14} />, run: exportDoc },
      { id: 'star', label: active.isStarred ? 'Remove from favorites' : 'Add to favorites', icon: <Star size={14} />, run: () => toggleStar(active.id) },
    ] : []),
    { id: 'theme', label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme', icon: theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />, run: toggleTheme },
    { id: 'sidebar', label: 'Toggle sidebar', icon: <PanelLeft size={14} />, shortcut: '⌘B', run: () => setSidebarOpen((o) => !o) },
  ], [newDoc, openCopilot, active, exportDoc, toggleStar, theme, toggleTheme]);

  const sync = SYNC_UI[ws.sync.state];

  return (
    <div className="flex h-screen overflow-hidden bg-app text-fg">
      <ServerWakeBanner />

      {/* Sidebar (docked on desktop, drawer on mobile) */}
      {sidebarOpen && isMobile && <div className="fixed inset-0 z-[80] bg-black/50" onClick={() => setSidebarOpen(false)} aria-hidden />}
      {sidebarOpen && (
        <div className={cn(isMobile && 'fixed inset-y-0 left-0 z-[85] shadow-pop')}>
          <Sidebar
            user={user}
            docs={docs}
            activeId={active?.id ?? null}
            view={view}
            loading={ws.loading}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSelectDoc={openDoc}
            onOpenTasks={() => { setView('tasks'); if (isMobile) setSidebarOpen(false); }}
            onOpenHome={() => { setView('home'); if (isMobile) setSidebarOpen(false); }}
            onOpenSettings={() => setSettingsOpen(true)}
            onNewDoc={(t, parent) => void newDoc(t, parent ?? null)}
            onDeleteDoc={removeDoc}
            onToggleStar={toggleStar}
            onOpenPalette={() => { setPaletteOpen(true); onboarding.mark('palette'); }}
            onLogout={onLogout}
            onHome={onBackToLanding}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-12 flex-none items-center gap-2 border-b border-line px-3">
          <button onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle sidebar" className="btn-ghost h-8 w-8 !px-0">{isMobile ? <Menu size={16} /> : <PanelLeft size={16} />}</button>

          <nav className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted" aria-label="Breadcrumb">
            {view === 'home' ? (
              <span className="flex items-center gap-1.5 font-medium text-fg"><Home size={14} /> Home</span>
            ) : view === 'tasks' ? (
              <span className="flex items-center gap-1.5 font-medium text-fg"><KanbanSquare size={14} /> Sprint board</span>
            ) : active ? (
              <span className="flex min-w-0 items-center gap-1.5">
                <span>{active.icon || '📄'}</span>
                <span className="truncate font-medium text-fg">{active.title || 'Untitled'}</span>
              </span>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {view === 'page' && active && (
              <span role="status" aria-live="polite" className={cn('mr-1 flex items-center gap-1.5 text-[12px]', sync.tone)}>
                {sync.icon === 'ok' && <Check size={12} />}
                {sync.icon === 'spin' && <RefreshCw size={12} className="animate-spin" />}
                {sync.icon === 'off' && <WifiOff size={12} />}
                {sync.icon === 'warn' && <AlertTriangle size={12} />}
                <span className="hidden sm:inline">{sync.label}</span>
                {ws.sync.state === 'saved' && ws.sync.latencyMs !== null && <span className="hidden font-mono text-[10.5px] text-faint md:inline">{ws.sync.latencyMs}ms</span>}
                {ws.sync.state === 'error' && <button onClick={ws.sync.retryNow} className="ml-1 rounded-md border border-line-strong px-1.5 text-[11px] text-fg">Retry</button>}
              </span>
            )}

            <button onClick={() => setPaletteOpen(true)} aria-label="Search" className="btn-ghost h-8 w-8 !px-0 md:hidden"><Search size={15} /></button>
            {view === 'page' && active && (
              <button onClick={() => setHistoryOpen(true)} aria-label="Version history" title="Version history" className="btn-ghost h-8 w-8 !px-0"><History size={15} /></button>
            )}
            <button onClick={toggleTheme} aria-label="Toggle theme" className="btn-ghost h-8 w-8 !px-0">{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
            <button
              onClick={() => setCopilotOpen((o) => !o)}
              aria-pressed={copilotOpen}
              className={cn('btn h-8 gap-1.5', copilotOpen ? 'bg-accent/15 text-accent' : 'btn-outline')}
            >
              <Sparkles size={14} /> <span className="hidden sm:inline">Copilot</span>
            </button>
            {view === 'page' && active && (
              <Popover align="right" trigger={({ toggle }) => <button onClick={toggle} aria-label="More" className="btn-ghost h-8 w-8 !px-0"><MoreHorizontal size={16} /></button>}>
                {(close) => (
                  <>
                    <MenuItem onClick={() => { toggleStar(active.id); close(); }}><Star size={14} /> {active.isStarred ? 'Remove favorite' : 'Add to favorites'}</MenuItem>
                    <MenuItem onClick={() => { exportDoc(); close(); }}><Download size={14} /> Export as HTML</MenuItem>
                    <MenuItem danger onClick={() => { removeDoc(active.id); close(); }}><Trash2 size={14} /> Delete page</MenuItem>
                  </>
                )}
              </Popover>
            )}
          </div>
        </header>

        {ws.conflict && (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-danger/30 bg-danger/10 px-4 py-2 text-[13px]">
            <AlertTriangle size={15} className="text-danger" />
            <span>This page was changed in another tab or device. Your latest edits are not saved yet.</span>
            <span className="ml-auto flex gap-2">
              <button className="btn-outline h-7" onClick={() => { ws.resolveConflict('theirs'); setNonce((n) => n + 1); }}>Load their version</button>
              <button className="btn-primary h-7" onClick={() => ws.resolveConflict('mine')}>Keep mine</button>
            </span>
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1" id="main">
            <motion.div key={view === 'page' ? `page-${active?.id ?? 'none'}` : view} className="h-full" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}>
            {ws.loadError ? (
              <EmptyState icon={<WifiOff size={22} />} title="Couldn’t load your workspace" body={ws.loadError} action={<button className="btn-primary" onClick={() => void ws.reload()}><RefreshCw size={14} /> Try again</button>} />
            ) : view === 'home' ? (
              <HomeView
                user={user}
                docs={docs}
                tasks={ws.tasks}
                loading={ws.loading}
                onboarding={onboarding}
                onOpenDoc={openDoc}
                onNewDoc={(t) => void newDoc(t)}
                onOpenTasks={() => setView('tasks')}
                onOpenCopilot={() => openCopilot()}
                onOpenPalette={() => { setPaletteOpen(true); onboarding.mark('palette'); }}
              />
            ) : view === 'tasks' ? (
              <TasksView
                tasks={ws.tasks}
                loading={ws.loading}
                userName={user?.name || 'You'}
                onCreate={(p) => { onboarding.mark('task'); void ws.createTask(p, user?.name?.split(' ')[0] || 'You'); }}
                onUpdate={(id, p) => void ws.updateTask(id, p)}
                onDelete={(id) => void ws.deleteTask(id)}
              />
            ) : ws.loading ? (
              <div className="mx-auto max-w-[740px] space-y-4 px-10 pt-24" aria-label="Loading">
                <div className="skeleton h-16 w-16" /><div className="skeleton h-10 w-2/3" /><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-5/6" /><div className="skeleton h-4 w-3/4" />
              </div>
            ) : active ? (
              <PageView
                key={active.id}
                doc={active}
                editorKey={editorKey}
                onPatch={(patch) => ws.patchDoc(active.id, patch)}
                onAskAI={(p) => openCopilot(p)}
                onSlashUsed={() => onboarding.mark('slash')}
              />
            ) : (
              <EmptyState
                icon={<FilePlus2 size={22} />}
                title="Start your workspace"
                body="Create a page for notes, plans or docs. Press / inside a page for blocks, or ⌘K to jump anywhere."
                action={<button className="btn-primary" onClick={() => void newDoc()}><FilePlus2 size={14} /> New page</button>}
              />
            )}
            </motion.div>
          </main>

          <CopilotPanel
            open={copilotOpen}
            onClose={() => setCopilotOpen(false)}
            output={ai.output}
            loading={ai.loading}
            error={ai.error}
            lastPrompt={ai.lastPrompt}
            seedPrompt={seedPrompt}
            onSeedConsumed={() => setSeedPrompt('')}
            onRun={runAi}
            onStop={ai.stop}
            onInsert={insertAi}
            onCopy={() => void copyAi()}
          />
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} docs={docs} actions={actions} onOpenDoc={openDoc} />

      {settingsOpen && (
        <SettingsModal
          user={user}
          theme={theme}
          onTheme={setTheme}
          getHeaders={ws.headers}
          onClose={() => setSettingsOpen(false)}
          onAccountDeleted={() => { setSettingsOpen(false); onLogout(); }}
          onToast={(m, tone) => toast(m, { tone })}
        />
      )}

      {historyOpen && active && (
        <VersionHistory
          docId={active.id}
          getHeaders={ws.headers}
          onClose={() => setHistoryOpen(false)}
          onRestored={(d) => { ws.replaceDoc(d); setNonce((n) => n + 1); toast('Version restored'); }}
        />
      )}
    </div>
  );
}

function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="grid h-full place-items-center p-6">
      <div className="max-w-sm animate-fade-up text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-line bg-fg/[0.03] text-accent">{icon}</div>
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        <p className="mb-5 mt-1.5 text-[13.5px] text-muted">{body}</p>
        {action}
      </div>
    </div>
  );
}

export default Workspace;
