import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Settings, Users } from 'lucide-react';
import type { Workspace } from '../../types/workspace';
import { cn } from '../../lib/utils';

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSelectWorkspace: (workspace: Workspace) => void;
  onOpenSettings?: () => void;
}

export const WorkspaceSelector: React.FC<WorkspaceSelectorProps> = ({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative px-3 py-2" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg",
          "text-left text-sm font-medium transition-colors duration-150",
          "hover:bg-zinc-900 border border-transparent hover:border-zinc-800/80",
          isOpen && "bg-zinc-900 border-zinc-800/80 shadow-sm"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold text-white shadow-inner flex-shrink-0",
            activeWorkspace.avatarBg || "bg-indigo-600"
          )}>
            <span>{activeWorkspace.icon}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-100 truncate">
                {activeWorkspace.name}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                {activeWorkspace.plan}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Users className="w-2.5 h-2.5 text-zinc-400" />
              {activeWorkspace.membersCount} members
            </span>
          </div>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0",
          isOpen && "transform rotate-180 text-zinc-200"
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-3 right-3 mt-1.5 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/80 py-1.5 backdrop-blur-xl animate-slide-down">
          <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Workspaces
          </div>
          
          <div className="space-y-0.5 px-1 py-1">
            {workspaces.map((ws) => {
              const isSelected = ws.id === activeWorkspace.id;
              return (
                <button
                  key={ws.id}
                  onClick={() => {
                    onSelectWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors",
                    isSelected 
                      ? "bg-zinc-800 text-zinc-100 font-medium" 
                      : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      "w-5 h-5 rounded flex items-center justify-center text-[10px] text-white",
                      ws.avatarBg
                    )}>
                      {ws.icon}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>

          <div className="my-1 border-t border-zinc-800" />

          <div className="px-1 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                alert('Create workspace dialog');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create or join workspace</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings?.();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Workspace preferences</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
