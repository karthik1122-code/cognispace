import React, { useState, useEffect } from 'react';
import { BreadcrumbBar } from './BreadcrumbBar';
import { DocumentHeader } from './DocumentHeader';
import { TiptapEditor } from '../editor/TiptapEditor';
import { useAutosave } from '../../hooks/useAutosave';
import type { DocumentItem, BreadcrumbNode, DocumentStatus } from '../../types/workspace';

interface MainCanvasProps {
  activeDoc: DocumentItem;
  breadcrumbs: BreadcrumbNode[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSelectBreadcrumb: (id: string) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateIcon: (icon: string) => void;
  onChangeStatus: (status: DocumentStatus) => void;
  onToggleFavorite: () => void;
  onOpenAI: () => void;
}

export const MainCanvas: React.FC<MainCanvasProps> = ({
  activeDoc,
  breadcrumbs,
  isSidebarOpen,
  onToggleSidebar,
  onSelectBreadcrumb,
  onUpdateTitle,
  onUpdateIcon,
  onChangeStatus,
  onToggleFavorite,
  onOpenAI,
}) => {
  // Optimistic local state for zero-latency editing
  const [localTitle, setLocalTitle] = useState(activeDoc.title);
  const [localContent, setLocalContent] = useState<any>(activeDoc.content);

  useEffect(() => {
    setLocalTitle(activeDoc.title);
    setLocalContent(activeDoc.content);
  }, [activeDoc.id]);

  // Hook for debounced autosaving (800ms) with PATCH request
  const { saveStatus, retry } = useAutosave({
    documentId: activeDoc.id,
    payload: {
      title: localTitle,
      content: localContent,
    },
    delay: 800,
  });

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    onUpdateTitle(newTitle); // Sync with sidebar and breadcrumbs immediately
  };

  const handleContentChange = (newContent: any) => {
    setLocalContent(newContent); // Optimistic local update
  };

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#09090b]">
      {/* Top Breadcrumb & Actions Bar with Saving Status */}
      <BreadcrumbBar
        breadcrumbs={breadcrumbs}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onSelectBreadcrumb={onSelectBreadcrumb}
        status={activeDoc.status}
        onChangeStatus={onChangeStatus}
        isFavorite={activeDoc.isFavorite}
        onToggleFavorite={onToggleFavorite}
        onOpenAI={onOpenAI}
        saveStatus={saveStatus}
        onRetrySave={retry}
      />

      {/* Main Document Content Canvas (Scrollable) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Document Header (Editable H1, Icon, Cover, Metadata) */}
        <DocumentHeader
          document={{ ...activeDoc, title: localTitle }}
          onUpdateTitle={handleTitleChange}
          onUpdateIcon={onUpdateIcon}
        />

        {/* Tiptap Rich-Text Editor with Slash Commands */}
        <TiptapEditor
          key={activeDoc.id}
          initialContent={activeDoc.content}
          documentTitle={localTitle}
          onContentChange={handleContentChange}
          onOpenAIModal={onOpenAI}
        />
      </div>
    </main>
  );
};
