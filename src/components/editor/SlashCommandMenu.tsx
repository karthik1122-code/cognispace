import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { SlashCommandItem } from './slashCommands';
import { cn } from '../../lib/utils';
import { Sparkles, Heading1, Heading2, Heading3, List, CheckSquare, Code } from 'lucide-react';

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuRef, SlashCommandMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          return true;
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }

        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="z-50 w-64 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl text-xs text-zinc-400">
          No matching commands
        </div>
      );
    }

    const renderIcon = (title: string) => {
      switch (title) {
        case 'Heading 1':
          return <Heading1 className="w-4 h-4 text-zinc-300" />;
        case 'Heading 2':
          return <Heading2 className="w-4 h-4 text-zinc-300" />;
        case 'Heading 3':
          return <Heading3 className="w-4 h-4 text-zinc-300" />;
        case 'Bullet List':
          return <List className="w-4 h-4 text-zinc-300" />;
        case 'Task List':
          return <CheckSquare className="w-4 h-4 text-indigo-400" />;
        case 'Code Block':
          return <Code className="w-4 h-4 text-zinc-300" />;
        case 'AI Prompt Block':
          return <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />;
        default:
          return <span className="text-xs font-mono font-bold">/</span>;
      }
    };

    return (
      <div className="z-50 w-72 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl animate-slide-down">
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
          <span>Commands</span>
          <span className="text-[9px] lowercase text-zinc-400">↑↓ to navigate</span>
        </div>

        <div className="space-y-0.5">
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors text-xs",
                  isSelected
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-300 hover:bg-zinc-800/60"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center border flex-shrink-0",
                  isSelected ? "bg-zinc-950 border-zinc-700" : "bg-zinc-900 border-zinc-800"
                )}>
                  {renderIcon(item.title)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-200">{item.title}</span>
                    {item.title === 'AI Prompt Block' && (
                      <span className="text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">{item.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
