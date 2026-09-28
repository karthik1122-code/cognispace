import React from 'react';
import { PanelLeftClose } from 'lucide-react';
import { WorkspaceSelector } from './WorkspaceSelector';
import { QuickActions } from './QuickActions';
import { DocumentTree } from './DocumentTree';
import { UserProfileCard } from './UserProfileCard';
import { CogniSpaceLogo } from '../ui/CogniSpaceLogo';
import type { DocumentItem, Workspace, UserProfile } from '../../types/workspace';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggleSidebar: () => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  documents: DocumentItem[];
  activeDocId: string;
  onSelectDoc: (doc: DocumentItem) => void;
  onToggleExpandDoc: (id: string) => void;
  onAddChildDoc: (parentId: string) => void;
  onAddRootPage: () => void;
  onDeleteDoc: (id: string) => void;
  onRenameDoc: (id: string, newTitle: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenSearch: () => void;
  onOpenAllNotes: () => void;
  onOpenAI: () => void;
  onOpenSettings: () => void;
  user: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggleSidebar,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  documents,
  activeDocId,
  onSelectDoc,
  onToggleExpandDoc,
  onAddChildDoc,
  onAddRootPage,
  onDeleteDoc,
  onRenameDoc,
  onToggleFavorite,
  onOpenSearch,
  onOpenAllNotes,
  onOpenAI,
  onOpenSettings,
  user,
}) => {
  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={onToggleSidebar}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={cn(
          "fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col",
          "w-64 sm:w-72 h-screen bg-[#0c0d10] border-r border-zinc-800/80 select-none",
          "transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:-ml-64 sm:lg:-ml-72"
        )}
      >
        {/* Sidebar Header: CogniSpace Brand + Collapse Toggle */}
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-zinc-800/80">
          <CogniSpaceLogo size="md" showTagline={false} />

          <button
            type="button"
            onClick={onToggleSidebar}
            title="Collapse sidebar (⌘\)"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Selector Dropdown */}
        <WorkspaceSelector
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onSelectWorkspace={onSelectWorkspace}
          onOpenSettings={onOpenSettings}
        />

        {/* Quick Actions (Search, CogniSpace AI, New Page, All Notes) */}
        <QuickActions
          onOpenSearch={onOpenSearch}
          onNewPage={onAddRootPage}
          onOpenAllNotes={onOpenAllNotes}
          onOpenAI={onOpenAI}
        />

        {/* Divider */}
        <div className="mx-3 my-1 border-t border-zinc-800/80" />

        {/* 3-Level Expandable Document Tree */}
        <DocumentTree
          documents={documents}
          activeDocId={activeDocId}
          onSelectDoc={onSelectDoc}
          onToggleExpand={onToggleExpandDoc}
          onAddChild={onAddChildDoc}
          onAddRootPage={onAddRootPage}
          onDeleteDoc={onDeleteDoc}
          onRenameDoc={onRenameDoc}
          onToggleFavorite={onToggleFavorite}
        />

        {/* Bottom Profile Card */}
        <UserProfileCard
          user={user}
          onOpenSettings={onOpenSettings}
        />
      </aside>
    </>
  );
};
