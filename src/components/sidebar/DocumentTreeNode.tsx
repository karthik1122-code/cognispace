import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronRight, 
  File, 
  Folder, 
  FolderOpen, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit2, 
  Star, 
  FilePlus,
} from 'lucide-react';
import type { DocumentItem } from '../../types/workspace';
import { cn } from '../../lib/utils';

interface DocumentTreeNodeProps {
  node: DocumentItem;
  level: number;
  activeDocId: string;
  onSelect: (doc: DocumentItem) => void;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const DocumentTreeNode: React.FC<DocumentTreeNodeProps> = ({
  node,
  level = 1,
  activeDocId,
  onSelect,
  onToggleExpand,
  onAddChild,
  onDelete,
  onRename,
  onToggleFavorite,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isExpanded = Boolean(node.isExpanded);
  const isActive = node.id === activeDocId;
  const canHaveMoreChildren = level < 3; // Support up to 3 levels deep

  // Padding calculations for 3 levels deep indentation
  const paddingLeft = level === 1 ? 'pl-2' : level === 2 ? 'pl-6' : 'pl-10';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveRename = () => {
    if (editTitle.trim()) {
      onRename(node.id, editTitle.trim());
    } else {
      setEditTitle(node.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditTitle(node.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="relative select-none group/node">
      {/* Visual hierarchy vertical guide line for levels 2 & 3 */}
      {level > 1 && (
        <div 
          className="absolute top-0 bottom-0 border-l border-zinc-800/80 pointer-events-none"
          style={{ left: `${(level - 1) * 16 + 4}px` }}
        />
      )}

      <div
        className={cn(
          "w-full flex items-center justify-between py-1 pr-2 rounded-lg text-xs transition-all group/item relative",
          paddingLeft,
          isActive 
            ? "bg-zinc-800/90 text-zinc-100 font-medium shadow-xs border border-zinc-700/60" 
            : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200 border border-transparent"
        )}
      >
        {/* Active Indicator Bar */}
        {isActive && (
          <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-indigo-500 rounded-r-full" />
        )}

        <div 
          className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
          onClick={() => {
            if (!isEditing) onSelect(node);
          }}
        >
          {/* Expand/Collapse Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className={cn(
              "w-4 h-4 flex items-center justify-center rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-transform duration-150",
              !hasChildren && "opacity-0 group-hover/item:opacity-40"
            )}
          >
            <ChevronRight className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              isExpanded && "transform rotate-90"
            )} />
          </button>

          {/* Node Icon */}
          <span className="text-xs flex-shrink-0">
            {node.icon ? (
              <span className="text-sm leading-none">{node.icon}</span>
            ) : hasChildren ? (
              isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-indigo-400" /> : <Folder className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <File className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </span>

          {/* Node Title / Inline Rename Input */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveRename}
              onKeyDown={handleKeyDown}
              className="bg-zinc-950 border border-indigo-500/80 text-zinc-100 px-1 py-0.5 rounded text-xs w-full focus:outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate flex-1 text-left">
              {node.title}
            </span>
          )}

          {/* Favorite Indicator */}
          {node.isFavorite && !isEditing && (
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>

        {/* Hover Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
            {canHaveMoreChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id);
                }}
                title={`Add sub-page (Level ${level + 1})`}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className={cn(
                  "w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-zinc-100 transition-colors",
                  isMenuOpen && "bg-zinc-700 text-zinc-100 opacity-100"
                )}
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>

              {/* Node Options Context Menu */}
              {isMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-1 z-50 w-44 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 backdrop-blur-xl animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canHaveMoreChildren && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onAddChild(node.id);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    >
                      <FilePlus className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Add sub-page</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Rename</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onToggleFavorite(node.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                  >
                    <Star className={cn("w-3.5 h-3.5", node.isFavorite ? "text-amber-400 fill-amber-400" : "text-zinc-400")} />
                    <span>{node.isFavorite ? "Remove favorite" : "Add to favorites"}</span>
                  </button>

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(node.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recursive Children (Up to 3 levels deep) */}
      {hasChildren && isExpanded && (
        <div className="space-y-0.5 mt-0.5">
          {node.children!.map((child) => (
            <DocumentTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              activeDocId={activeDocId}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onDelete={onDelete}
              onRename={onRename}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};
