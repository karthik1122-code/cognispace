import React from 'react';
import { Plus, FolderPlus, Compass } from 'lucide-react';
import type { DocumentItem } from '../../types/workspace';
import { DocumentTreeNode } from './DocumentTreeNode';

interface DocumentTreeProps {
  documents: DocumentItem[];
  activeDocId: string;
  onSelectDoc: (doc: DocumentItem) => void;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onAddRootPage: () => void;
  onDeleteDoc: (id: string) => void;
  onRenameDoc: (id: string, newTitle: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const DocumentTree: React.FC<DocumentTreeProps> = ({
  documents,
  activeDocId,
  onSelectDoc,
  onToggleExpand,
  onAddChild,
  onAddRootPage,
  onDeleteDoc,
  onRenameDoc,
  onToggleFavorite,
}) => {
  // Helper to extract favorite documents recursively
  const getFavorites = (docs: DocumentItem[]): DocumentItem[] => {
    let favs: DocumentItem[] = [];
    for (const doc of docs) {
      if (doc.isFavorite) favs.push(doc);
      if (doc.children) favs = favs.concat(getFavorites(doc.children));
    }
    return favs;
  };

  const favoriteDocs = getFavorites(documents);

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
      {/* Favorites Section (if any) */}
      {favoriteDocs.length > 0 && (
        <div className="space-y-1">
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Favorites
            </span>
          </div>
          <div className="space-y-0.5">
            {favoriteDocs.map((doc) => (
              <div
                key={`fav-${doc.id}`}
                onClick={() => onSelectDoc(doc)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors ${
                  doc.id === activeDocId
                    ? 'bg-zinc-800 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <span className="text-sm leading-none">{doc.icon || '📄'}</span>
                <span className="truncate flex-1">{doc.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Documents Hierarchy (3 Levels Deep) */}
      <div className="space-y-1">
        <div className="px-2 py-1 flex items-center justify-between group">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Workspace
          </span>
          <button
            onClick={onAddRootPage}
            title="Create new root page"
            className="w-4 h-4 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors opacity-60 group-hover:opacity-100"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="px-3 py-6 text-center border border-dashed border-zinc-800/80 rounded-xl bg-zinc-900/40">
            <Compass className="w-6 h-6 text-zinc-400 mx-auto mb-2 opacity-50" />
            <p className="text-xs text-zinc-400 mb-2">No pages in workspace</p>
            <button
              onClick={onAddRootPage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create First Page</span>
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {documents.map((doc) => (
              <DocumentTreeNode
                key={doc.id}
                node={doc}
                level={1}
                activeDocId={activeDocId}
                onSelect={onSelectDoc}
                onToggleExpand={onToggleExpand}
                onAddChild={onAddChild}
                onDelete={onDeleteDoc}
                onRename={onRenameDoc}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
