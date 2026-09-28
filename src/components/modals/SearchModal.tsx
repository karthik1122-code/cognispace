import React, { useEffect, useState, useRef } from 'react';
import { Search, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';

export interface SearchDocItem {
  id: string;
  title: string;
  content?: any;
  icon?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  documents: SearchDocItem[];
  onSelectDoc: (doc: SearchDocItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  documents,
  onSelectDoc,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (e.key === 'Escape') {
        onClose(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = documents.filter((doc) => {
    const q = query.toLowerCase();
    const titleMatch = doc.title.toLowerCase().includes(q);
    const contentMatch = typeof doc.content === 'string' && doc.content.toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      onSelectDoc(filtered[selectedIndex]);
      onClose(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-24 px-4 animate-fade-in"
      onClick={() => onClose(false)}
    >
      <div 
        className="w-full max-w-xl bg-[#0c0e14] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search size={16} className="text-zinc-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes, specifications, or commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 font-sans"
          />
          <kbd className="text-[10px] font-mono bg-white/[0.06] text-zinc-400 px-1.5 py-0.5 rounded border border-white/[0.08] select-none">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
              <Search size={20} className="text-zinc-600" />
              <span>No matching documents found for "{query}"</span>
            </div>
          ) : (
            filtered.map((doc, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelectDoc(doc);
                    onClose(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors group ${
                    isSelected
                      ? 'bg-purple-600/20 text-white font-medium border border-purple-500/30'
                      : 'hover:bg-white/[0.04] text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-sm">{doc.icon || '📄'}</span>
                    <span className="truncate">{doc.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CornerDownLeft size={13} className="text-purple-400 animate-pulse" />
                    ) : (
                      <ArrowRight size={13} className="text-zinc-600 group-hover:text-zinc-400 transition" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Quick Keys */}
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px] text-zinc-400">↑</kbd>
            <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px] text-zinc-400">↓</kbd>
            <span>Open</span>
            <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px] text-zinc-400">↵</kbd>
          </div>
          <span className="flex items-center gap-1 text-purple-400/80">
            <Sparkles size={11} /> CogniSpace Spotlight
          </span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
