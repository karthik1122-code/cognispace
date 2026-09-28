import React from 'react';
import { Search, Plus, FileText, Sparkles, Compass } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickActionsProps {
  onOpenSearch: () => void;
  onNewPage: () => void;
  onOpenAllNotes: () => void;
  onOpenAI?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onOpenSearch,
  onNewPage,
  onOpenAllNotes,
  onOpenAI,
}) => {
  return (
    <div className="px-3 py-1.5 space-y-0.5">
      {/* Search Action */}
      <button
        onClick={onOpenSearch}
        className={cn(
          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300",
          "hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-800/80 border border-transparent transition-all group"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span>Search</span>
        </div>
        <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded shadow-xs group-hover:border-zinc-700">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Ask CogniSpace AI Action */}
      <button
        onClick={onOpenAI}
        className={cn(
          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium",
          "text-purple-300 bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 hover:border-purple-800/60 transition-all group"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="font-semibold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-300 bg-clip-text text-transparent">
            Ask CogniSpace AI
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Copilot
        </span>
      </button>

      {/* New Page Action */}
      <button
        onClick={onNewPage}
        className={cn(
          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300",
          "hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-800/80 border border-transparent transition-all group"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span>New Page</span>
        </div>
        <span className="text-[11px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
          + N
        </span>
      </button>

      {/* All Notes Action */}
      <button
        onClick={onOpenAllNotes}
        className={cn(
          "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300",
          "hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-800/80 border border-transparent transition-all group"
        )}
      >
        <div className="flex items-center gap-2.5">
          <FileText className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span>All Notes</span>
        </div>
        <Compass className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
};
