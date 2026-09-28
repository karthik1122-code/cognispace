import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, Moon, User, Bell, HelpCircle } from 'lucide-react';
import type { UserProfile } from '../../types/workspace';
import { cn } from '../../lib/utils';

interface UserProfileCardProps {
  user: UserProfile;
  onOpenSettings: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative p-2 border-t border-zinc-800/80 bg-zinc-950/60" ref={cardRef}>
      {/* Profile Card Trigger */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-900 transition-colors">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
        >
          {/* Avatar with live status indicator */}
          <div className="relative flex-shrink-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-zinc-700/60"
            />
            <span
              className={cn(
                "absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-zinc-950",
                user.statusIndicator === 'online' ? 'bg-emerald-500' :
                user.statusIndicator === 'busy' ? 'bg-amber-500' :
                user.statusIndicator === 'away' ? 'bg-blue-500' : 'bg-zinc-500'
              )}
            />
          </div>

          {/* User Info */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-100 truncate">
              {user.name}
            </span>
            <span className="text-[11px] text-zinc-400 truncate">
              {user.role}
            </span>
          </div>
        </button>

        {/* Settings gear shortcut */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Open Settings"
          className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors flex-shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* User Context Menu Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-2 right-2 mb-2 z-50 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1.5 backdrop-blur-xl animate-slide-down">
          {/* Status info bar */}
          <div className="px-3 py-2 border-b border-zinc-800/80 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-300 font-medium truncate">
              {user.statusText}
            </span>
          </div>

          <div className="px-1 py-1 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-zinc-400" />
              <span>Profile & Account</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                alert('Notifications preferences');
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-zinc-400" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                alert('App Theme is Dark (Linear / Notion primary)');
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-3.5 h-3.5 text-zinc-400" />
                <span>Appearance</span>
              </div>
              <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/40">Dark</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                alert('Keyboard Shortcuts: Cmd+K for search, Cmd+\\ to toggle sidebar');
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Help & Shortcuts</span>
            </button>
          </div>

          <div className="my-1 border-t border-zinc-800" />

          <div className="px-1">
            <button
              onClick={() => {
                setIsOpen(false);
                alert('Session reset');
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
