import React, { useState, useRef, useEffect } from 'react';
import { Smile, Image as ImageIcon, Clock, Hash } from 'lucide-react';
import type { DocumentItem } from '../../types/workspace';
import { cn } from '../../lib/utils';

interface DocumentHeaderProps {
  document: DocumentItem;
  onUpdateTitle: (newTitle: string) => void;
  onUpdateIcon: (newIcon: string) => void;
  onUpdateCover?: (coverUrl: string | undefined) => void;
}

const COMMON_EMOJIS = ['🎨', '⚡', '🚀', '🏛️', '⚙️', '📊', '🧠', '✨', '📝', '💡', '🌱', '🔥', '🛡️', '📦', '🎯'];

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  document: docItem,
  onUpdateTitle,
  onUpdateIcon,
  onUpdateCover,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hasCover, setHasCover] = useState(Boolean(docItem.coverImage));
  const titleInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCover = () => {
    if (hasCover) {
      setHasCover(false);
      onUpdateCover?.(undefined);
    } else {
      setHasCover(true);
      onUpdateCover?.('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80');
    }
  };

  return (
    <div className="w-full">
      {/* Optional Cover Banner */}
      {hasCover && (
        <div className="relative w-full h-40 sm:h-48 bg-zinc-900 overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80"
            alt="Cover"
            className="w-full h-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <button
              onClick={toggleCover}
              className="px-2.5 py-1 text-xs bg-zinc-900/80 hover:bg-zinc-900 text-zinc-200 backdrop-blur rounded-lg border border-zinc-700/60 shadow-lg"
            >
              Remove Cover
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 sm:px-12 pt-8 pb-4">
        {/* Top hover quick actions for Header (Add Icon, Add Cover) */}
        <div className="flex items-center gap-3 mb-3 text-xs text-zinc-400 group">
          {!docItem.icon && (
            <button
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Add icon</span>
            </button>
          )}

          <button
            onClick={toggleCover}
            className="flex items-center gap-1 hover:text-zinc-200 transition-colors opacity-60 group-hover:opacity-100"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{hasCover ? 'Change cover' : 'Add cover'}</span>
          </button>
        </div>

        {/* Document Icon Picker Trigger */}
        <div className="relative mb-3" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-2xl hover:bg-zinc-850 hover:border-zinc-700 transition-all shadow-md group"
          >
            <span>{docItem.icon || '📄'}</span>
          </button>

          {/* Emoji / Icon Selector Popover */}
          {isPickerOpen && (
            <div className="absolute left-0 top-full mt-2 z-50 p-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl w-64 animate-slide-down">
              <div className="text-[11px] font-semibold text-zinc-400 px-1 mb-2 uppercase tracking-wider">
                Select Page Icon
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onUpdateIcon(emoji);
                      setIsPickerOpen(false);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-lg rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editable Inline H1 Title */}
        <div className="relative group">
          <input
            ref={titleInputRef}
            type="text"
            value={docItem.title}
            onChange={(e) => onUpdateTitle(e.target.value)}
            placeholder="Untitled Page"
            className={cn(
              "w-full bg-transparent border-none p-0 text-3xl sm:text-4xl font-bold tracking-tight text-zinc-100",
              "placeholder:text-zinc-600 focus:outline-none focus:ring-0",
              "transition-colors"
            )}
          />
        </div>

        {/* Document Metadata Strip */}
        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-zinc-800/60 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <img
              src={docItem.author?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80"}
              alt="Author"
              className="w-4 h-4 rounded-full object-cover"
            />
            <span className="text-zinc-300 font-medium">{docItem.author?.name || 'Karthik Uppari'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>Updated {docItem.updatedAt || 'just now'}</span>
          </div>

          <div className="flex items-center gap-1">
            <Hash className="w-3.5 h-3.5 text-zinc-400" />
            <span>340 words • 2 min read</span>
          </div>
        </div>
      </div>
    </div>
  );
};
