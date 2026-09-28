import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Plus, PanelLeft, ArrowRight, CornerDownLeft } from 'lucide-react';
import type { DocumentItem } from '../../types/workspace';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  onSelectDoc: (doc: DocumentItem) => void;
  onNewPage: () => void;
  onToggleSidebar: () => void;
  onOpenAI: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDoc,
  onNewPage,
  onToggleSidebar,
  onOpenAI,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Flatten nested document tree for search
  const flattenDocs = (docs: DocumentItem[], path = ''): Array<{ doc: DocumentItem; path: string }> => {
    let result: Array<{ doc: DocumentItem; path: string }> = [];
    for (const doc of docs) {
      const currentPath = path ? `${path} > ${doc.title}` : doc.title;
      result.push({ doc, path: currentPath });
      if (doc.children) {
        result = result.concat(flattenDocs(doc.children, currentPath));
      }
    }
    return result;
  };

  const allDocs = flattenDocs(documents);

  const filteredDocs = query.trim() === ''
    ? allDocs.slice(0, 5)
    : allDocs.filter(item => 
        item.doc.title.toLowerCase().includes(query.toLowerCase()) ||
        item.path.toLowerCase().includes(query.toLowerCase())
      );

  const actions = [
    {
      id: 'act-new-page',
      title: 'Create new page',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      handler: () => {
        onNewPage();
        onClose();
      }
    },
    {
      id: 'act-ai',
      title: 'Ask CogniSpace AI Copilot',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      handler: () => {
        onOpenAI();
        onClose();
      }
    },
    {
      id: 'act-sidebar',
      title: 'Toggle Left Sidebar (⌘\\)',
      icon: <PanelLeft className="w-4 h-4 text-zinc-400" />,
      handler: () => {
        onToggleSidebar();
        onClose();
      }
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
          <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, commands, or ask AI..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Documents Group */}
          {filteredDocs.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-2.5 py-1">
                Pages & Documents
              </div>
              <div className="space-y-0.5">
                {filteredDocs.map((item) => (
                  <button
                    key={item.doc.id}
                    onClick={() => {
                      onSelectDoc(item.doc);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm">{item.doc.icon || '📄'}</span>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="font-medium text-zinc-200 truncate">{item.doc.title}</span>
                        <span className="text-[10px] text-zinc-400 truncate">{item.path}</span>
                      </div>
                    </div>
                    <CornerDownLeft className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Group */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-2.5 py-1">
              Quick Actions
            </div>
            <div className="space-y-0.5">
              {actions.map((act) => (
                <button
                  key={act.id}
                  onClick={act.handler}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    {act.icon}
                    <span className="font-medium">{act.title}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Navigate with</span>
            <kbd className="px-1 py-0.5 text-[9px] bg-zinc-800 rounded">↑</kbd>
            <kbd className="px-1 py-0.5 text-[9px] bg-zinc-800 rounded">↓</kbd>
          </div>
          <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent font-medium">
            CogniSpace Workspace
          </span>
        </div>
      </div>
    </div>
  );
};
