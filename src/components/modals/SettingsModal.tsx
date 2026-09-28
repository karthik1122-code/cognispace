import React from 'react';
import { X, Layers, Key, User, Palette } from 'lucide-react';
import type { UserProfile, Workspace } from '../../types/workspace';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  activeWorkspace: Workspace;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  activeWorkspace,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-down flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-semibold text-sm text-zinc-100">
              Workspace & App Preferences
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Design Tokens Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Palette className="w-3.5 h-3.5" />
              <span>Active Design Tokens (Dark-Mode Primary)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-4 h-4 rounded bg-zinc-950 border border-zinc-800 mb-1.5" />
                <div className="font-semibold text-zinc-200">Background</div>
                <div className="text-[11px] font-mono text-zinc-400">zinc-950 (#09090b)</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-4 h-4 rounded bg-zinc-900 border border-zinc-700 mb-1.5" />
                <div className="font-semibold text-zinc-200">Surfaces & Cards</div>
                <div className="text-[11px] font-mono text-zinc-400">zinc-900 (#18181b)</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-4 h-4 rounded border-2 border-zinc-800/80 mb-1.5" />
                <div className="font-semibold text-zinc-200">Borders</div>
                <div className="text-[11px] font-mono text-zinc-400">zinc-800/80 (1px)</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-4 h-4 rounded bg-zinc-100 mb-1.5" />
                <div className="font-semibold text-zinc-200">Primary Text</div>
                <div className="text-[11px] font-mono text-zinc-400">zinc-100 (#f4f4f5)</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-4 h-4 rounded bg-zinc-400 mb-1.5" />
                <div className="font-semibold text-zinc-200">Muted Text</div>
                <div className="text-[11px] font-mono text-zinc-400">zinc-400 (#a1a1aa)</div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="w-4 h-4 rounded bg-indigo-500 mb-1.5" />
                <div className="font-semibold text-zinc-200">Typography</div>
                <div className="text-[11px] font-mono text-zinc-400">Inter Sans-Serif</div>
              </div>
            </div>
          </div>

          {/* User Profile Overview */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <User className="w-3.5 h-3.5" />
              <span>User Profile & Workspace</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/50"
                />
                <div>
                  <div className="font-semibold text-sm text-zinc-100">{user.name}</div>
                  <div className="text-xs text-zinc-400">{user.email} • {user.role}</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                {activeWorkspace.plan} Plan
              </span>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <Key className="w-3.5 h-3.5" />
              <span>Keyboard Shortcuts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span>Quick Search / Command Palette</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-[10px]">⌘K</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span>Toggle Left Sidebar</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-[10px]">⌘\</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span>Insert Slash Command</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-[10px]">/</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800">
                <span>Close Modals / Overlays</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded font-mono text-[10px]">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
