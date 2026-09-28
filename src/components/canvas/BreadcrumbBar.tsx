import React, { useState } from 'react';
import { 
  PanelLeftOpen, 
  ChevronRight, 
  Star, 
  Share2, 
  Sparkles, 
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { BreadcrumbNode, DocumentStatus } from '../../types/workspace';
import type { SaveStatus } from '../../hooks/useAutosave';
import { cn } from '../../lib/utils';

interface BreadcrumbBarProps {
  breadcrumbs: BreadcrumbNode[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSelectBreadcrumb: (id: string) => void;
  status?: DocumentStatus;
  onChangeStatus?: (status: DocumentStatus) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onOpenAI?: () => void;
  saveStatus?: SaveStatus;
  onRetrySave?: () => void;
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  breadcrumbs,
  isSidebarOpen,
  onToggleSidebar,
  onSelectBreadcrumb,
  status = 'in-review',
  onChangeStatus,
  isFavorite = false,
  onToggleFavorite,
  onOpenAI,
  saveStatus = 'saved',
  onRetrySave,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getStatusBadge = (st: DocumentStatus) => {
    switch (st) {
      case 'published':
        return { label: 'Published', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', dot: 'bg-emerald-400' };
      case 'in-review':
        return { label: 'In Review', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300', dot: 'bg-amber-400' };
      case 'archived':
        return { label: 'Archived', bg: 'bg-zinc-800 border-zinc-700 text-zinc-400', dot: 'bg-zinc-500' };
      case 'draft':
      default:
        return { label: 'Draft', bg: 'bg-blue-500/10 border-blue-500/30 text-blue-300', dot: 'bg-blue-400' };
    }
  };

  const currentStatusBadge = getStatusBadge(status);

  return (
    <header className="h-12 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 z-20 flex-shrink-0">
      {/* Left side: Expand sidebar toggle + Nested Breadcrumbs + Autosave Indicator */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            title="Expand sidebar (⌘\)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors mr-1 flex-shrink-0"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        <nav aria-label="Breadcrumbs" className="flex items-center gap-1 text-xs text-zinc-400 min-w-0 overflow-x-auto no-scrollbar py-1">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id || idx}>
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => onSelectBreadcrumb(crumb.id)}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap",
                    isLast 
                      ? "text-zinc-100 font-semibold bg-zinc-900/60 border border-zinc-800/60 cursor-default" 
                      : "hover:text-zinc-200 hover:bg-zinc-900 cursor-pointer"
                  )}
                >
                  {crumb.icon && <span className="text-xs">{crumb.icon}</span>}
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{crumb.title}</span>
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Visual Autosave State Indicator */}
        <div className="hidden sm:flex items-center pl-2 ml-1 border-l border-zinc-800/80">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-300 transition-colors" title="All changes saved to workspace">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <button
              onClick={onRetrySave}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded"
              title="Click to retry save"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Error • Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Right side: Status, Presence avatars, Favorite, Share, AI Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Document Status Selector */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
              currentStatusBadge.bg
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", currentStatusBadge.dot)} />
            <span>{currentStatusBadge.label}</span>
          </button>

          {isStatusMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl py-1 text-xs">
              {(['draft', 'in-review', 'published', 'archived'] as DocumentStatus[]).map((st) => {
                const badge = getStatusBadge(st);
                return (
                  <button
                    key={st}
                    onClick={() => {
                      onChangeStatus?.(st);
                      setIsStatusMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
                    <span className="capitalize">{badge.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Collaborators Presence Stack */}
        <div className="hidden md:flex items-center -space-x-1.5 pl-1">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80"
            alt="Karthik"
            title="Karthik Uppari (Editing)"
            className="w-5 h-5 rounded-full ring-2 ring-zinc-950 object-cover"
          />
          <img
            src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&auto=format&fit=crop&q=80"
            alt="Elena"
            title="Elena Vance (Viewing)"
            className="w-5 h-5 rounded-full ring-2 ring-zinc-950 object-cover"
          />
          <div 
            title="+2 other viewers"
            className="w-5 h-5 rounded-full ring-2 ring-zinc-950 bg-zinc-800 text-[9px] font-bold text-zinc-300 flex items-center justify-center"
          >
            +2
          </div>
        </div>

        {/* Favorite toggle */}
        <button
          onClick={onToggleFavorite}
          title={isFavorite ? "Remove favorite" : "Add to favorites"}
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors",
            isFavorite && "text-amber-400 hover:text-amber-300"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", isFavorite && "fill-amber-400")} />
        </button>

        {/* Share Button with Toast indication */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg transition-colors shadow-xs"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>

        {/* Quick Ask AI button */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/60 rounded-lg transition-all shadow-xs group glow-ai"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>
      </div>
    </header>
  );
};
