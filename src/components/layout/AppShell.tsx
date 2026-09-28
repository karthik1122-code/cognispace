import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { MainCanvas } from '../canvas/MainCanvas';
import { CommandPalette } from '../modals/CommandPalette';
import { SettingsModal } from '../modals/SettingsModal';
import type { DocumentItem, Workspace, UserProfile, BreadcrumbNode, DocumentStatus } from '../../types/workspace';
import { INITIAL_DOCUMENTS, INITIAL_WORKSPACES, INITIAL_USER } from '../../data/initialData';

export const AppShell: React.FC = () => {
  const [workspaces] = useState<Workspace[]>(INITIAL_WORKSPACES);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(INITIAL_WORKSPACES[0]);
  const [user] = useState<UserProfile>(INITIAL_USER);
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>('doc-design-tokens');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Helper to find a document recursively
  const findDocument = useCallback((docs: DocumentItem[], id: string): DocumentItem | null => {
    for (const doc of docs) {
      if (doc.id === id) return doc;
      if (doc.children) {
        const found = findDocument(doc.children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Helper to find path to document for breadcrumbs
  const findBreadcrumbPath = useCallback((
    docs: DocumentItem[],
    targetId: string,
    currentPath: BreadcrumbNode[] = []
  ): BreadcrumbNode[] | null => {
    for (const doc of docs) {
      const newPath = [...currentPath, { id: doc.id, title: doc.title, icon: doc.icon }];
      if (doc.id === targetId) {
        return newPath;
      }
      if (doc.children && doc.children.length > 0) {
        const result = findBreadcrumbPath(doc.children, targetId, newPath);
        if (result) return result;
      }
    }
    return null;
  }, []);

  const activeDoc = findDocument(documents, activeDocId) || documents[0];

  const breadcrumbs: BreadcrumbNode[] = [
    { id: 'workspace-root', title: activeWorkspace.name, icon: activeWorkspace.icon },
    ...(findBreadcrumbPath(documents, activeDoc.id) || [{ id: activeDoc.id, title: activeDoc.title, icon: activeDoc.icon }])
  ];

  // Global Keyboard Shortcuts (Cmd+K, Cmd+\)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Cmd+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Toggle Sidebar (Cmd+\ or Ctrl+\)
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Toggle Document Expansion
  const handleToggleExpandDoc = (id: string) => {
    const updateExpand = (docs: DocumentItem[]): DocumentItem[] => {
      return docs.map(doc => {
        if (doc.id === id) {
          return { ...doc, isExpanded: !doc.isExpanded };
        }
        if (doc.children) {
          return { ...doc, children: updateExpand(doc.children) };
        }
        return doc;
      });
    };
    setDocuments(prev => updateExpand(prev));
  };

  // Select Document
  const handleSelectDoc = (doc: DocumentItem) => {
    setActiveDocId(doc.id);
  };

  // Add Root Page
  const handleAddRootPage = () => {
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: 'Untitled Page',
      icon: '📄',
      status: 'draft',
      updatedAt: 'Just now',
      isExpanded: true,
      children: [],
      content: [],
    };
    setDocuments(prev => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
  };

  // Add Child Page (Up to 3 levels deep)
  const handleAddChildDoc = (parentId: string) => {
    const newChild: DocumentItem = {
      id: `doc-sub-${Date.now()}`,
      title: 'Untitled Sub-Page',
      icon: '📄',
      status: 'draft',
      updatedAt: 'Just now',
      isExpanded: true,
      children: [],
      content: [],
    };

    const insertChild = (docs: DocumentItem[], currentLevel = 1): DocumentItem[] => {
      return docs.map(doc => {
        if (doc.id === parentId) {
          if (currentLevel >= 3) {
            alert('Maximum hierarchy depth (3 levels) reached.');
            return doc;
          }
          return {
            ...doc,
            isExpanded: true,
            children: [...(doc.children || []), newChild],
          };
        }
        if (doc.children) {
          return {
            ...doc,
            children: insertChild(doc.children, currentLevel + 1),
          };
        }
        return doc;
      });
    };

    setDocuments(prev => insertChild(prev));
    setActiveDocId(newChild.id);
  };

  // Delete Document
  const handleDeleteDoc = (id: string) => {
    const deleteRecursively = (docs: DocumentItem[]): DocumentItem[] => {
      return docs
        .filter(doc => doc.id !== id)
        .map(doc => ({
          ...doc,
          children: doc.children ? deleteRecursively(doc.children) : [],
        }));
    };

    setDocuments(prev => {
      const updated = deleteRecursively(prev);
      if (activeDocId === id && updated.length > 0) {
        setActiveDocId(updated[0].id);
      }
      return updated;
    });
  };

  // Rename Document
  const handleRenameDoc = (id: string, newTitle: string) => {
    const updateTitle = (docs: DocumentItem[]): DocumentItem[] => {
      return docs.map(doc => {
        if (doc.id === id) {
          return { ...doc, title: newTitle, updatedAt: 'Just now' };
        }
        if (doc.children) {
          return { ...doc, children: updateTitle(doc.children) };
        }
        return doc;
      });
    };
    setDocuments(prev => updateTitle(prev));
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    const updateFav = (docs: DocumentItem[]): DocumentItem[] => {
      return docs.map(doc => {
        if (doc.id === id) {
          return { ...doc, isFavorite: !doc.isFavorite };
        }
        if (doc.children) {
          return { ...doc, children: updateFav(doc.children) };
        }
        return doc;
      });
    };
    setDocuments(prev => updateFav(prev));
  };

  // Update Icon
  const handleUpdateIcon = (newIcon: string) => {
    const updateDocIcon = (docs: DocumentItem[]): DocumentItem[] => {
      return docs.map(doc => {
        if (doc.id === activeDocId) {
          return { ...doc, icon: newIcon };
        }
        if (doc.children) {
          return { ...doc, children: updateDocIcon(doc.children) };
        }
        return doc;
      });
    };
    setDocuments(prev => updateDocIcon(prev));
  };

  // Update Status
  const handleUpdateStatus = (newStatus: DocumentStatus) => {
    const updateDocStatus = (docs: DocumentItem[]): DocumentItem[] => {
      return docs.map(doc => {
        if (doc.id === activeDocId) {
          return { ...doc, status: newStatus };
        }
        if (doc.children) {
          return { ...doc, children: updateDocStatus(doc.children) };
        }
        return doc;
      });
    };
    setDocuments(prev => updateDocStatus(prev));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100">
      {/* Left Collapsible Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        documents={documents}
        activeDocId={activeDoc.id}
        onSelectDoc={handleSelectDoc}
        onToggleExpandDoc={handleToggleExpandDoc}
        onAddChildDoc={handleAddChildDoc}
        onAddRootPage={handleAddRootPage}
        onDeleteDoc={handleDeleteDoc}
        onRenameDoc={handleRenameDoc}
        onToggleFavorite={handleToggleFavorite}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onOpenAllNotes={() => setIsCommandPaletteOpen(true)}
        onOpenAI={() => setIsCommandPaletteOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
      />

      {/* Main Canvas Area */}
      <MainCanvas
        activeDoc={activeDoc}
        breadcrumbs={breadcrumbs}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectBreadcrumb={(crumbId) => {
          if (crumbId !== 'workspace-root') {
            setActiveDocId(crumbId);
          }
        }}
        onUpdateTitle={(title) => handleRenameDoc(activeDoc.id, title)}
        onUpdateIcon={handleUpdateIcon}
        onChangeStatus={handleUpdateStatus}
        onToggleFavorite={() => handleToggleFavorite(activeDoc.id)}
        onOpenAI={() => setIsCommandPaletteOpen(true)}
      />

      {/* Global Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        documents={documents}
        onSelectDoc={handleSelectDoc}
        onNewPage={handleAddRootPage}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenAI={() => alert('AI Assistant synthesis mode active')}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        activeWorkspace={activeWorkspace}
      />
    </div>
  );
};
