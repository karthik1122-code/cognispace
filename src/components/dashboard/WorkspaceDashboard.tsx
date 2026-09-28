import React, { useState, useEffect, useRef } from "react";
import { BlockEditor } from "../editor/BlockEditor";
import { SearchModal, type SearchDocItem } from "../modals/SearchModal";
import { streamAiToEditor } from "../../utils/aiStream";
import { apiUrl } from "../../utils/api";
import {
  FileText, Search, Plus, Sparkles, LogOut,
  Trash2, Check, ChevronRight, ChevronDown,
  MoreHorizontal, PanelLeftClose, PanelLeftOpen,
  Clock, RefreshCw, Star, Table,
  Bot, Share2, Tag, Calendar, User,
  CheckCheck, Filter, ArrowRight,
  SlidersHorizontal, Layers, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Production Design Tokens (Sleek Slate-Obsidian & Linear Cobalt) ──
const C = {
  bg:              "#08090d",
  sidebar:         "#0c0e15",
  canvas:          "#10121b",
  card:            "#131622",
  cardElevated:    "#171b2a",
  border:          "rgba(255, 255, 255, 0.07)",
  borderSubtle:    "rgba(255, 255, 255, 0.04)",
  borderFocus:     "rgba(99, 102, 241, 0.5)",
  cobalt:          "#5b5bd6",
  cobaltGlow:      "#6366f1",
  cyan:            "#0ea5e9",
  emerald:         "#10b981",
  amber:           "#f59e0b",
  purple:          "#8b5cf6",
  rose:            "#f43f5e",
  textPrimary:     "#f3f4f6",
  textSecondary:   "#9ca3af",
  textTertiary:    "#64748b",
  muted:           "#181b28",
};

export interface WorkspaceDoc {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  icon?: string;
  cover?: string;
  status?: "In Progress" | "Done" | "In Review" | "Backlog";
  priority?: "Urgent" | "High" | "Medium" | "Low";
  tags?: string[];
  isStarred?: boolean;
  parentId?: string | null;
}

export interface DatabaseRow {
  _id?: string;
  id: string;
  name: string;
  status: "In Progress" | "Done" | "In Review" | "Backlog";
  priority: "Urgent" | "High" | "Medium" | "Low";
  assignee: string;
  dueDate: string;
  progress: number;
}

interface WorkspaceDashboardProps {
  user?: { name: string; email: string; avatar?: string } | null;
  onLogout?: () => void;
  onBackToLanding?: () => void;
}

const COVER_PRESETS = [
  "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
  "linear-gradient(135deg, #092e35 0%, #0c4a6e 40%, #0284c7 100%)",
  "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)",
  "linear-gradient(135deg, #18181b 0%, #27272a 40%, #3f3f46 100%)",
  "linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #991b1b 100%)",
];

const EMOJI_PALETTE = ["🚀", "🧠", "📋", "💡", "⚡", "📊", "🛠️", "🎯", "🔒", "🎨", "📝", "🌟", "📚", "🔮", "✨"];

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({ user, onLogout, onBackToLanding }) => {
  const [documents, setDocuments] = useState<WorkspaceDoc[]>([]);
  const [activeDoc, setActiveDoc] = useState<WorkspaceDoc | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<"doc" | "database" | "ai">("doc");
  const [databaseRows, setDatabaseRows] = useState<DatabaseRow[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(true);
  const [dbFilterStatus, setDbFilterStatus] = useState<string>("All");

  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [omnibarQuery, setOmnibarQuery] = useState("");
  const [isOmnibarFocused, setIsOmnibarFocused] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [expandedSidebarIds, setExpandedSidebarIds] = useState<Set<string>>(new Set());
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  // Native AI Copilot thought stream output
  const [aiPanelOutput, setAiPanelOutput] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const omnibarRef = useRef<HTMLInputElement>(null);

  const getDocId = (doc: WorkspaceDoc | null) => doc?._id || doc?.id || "";
  const getTaskId = (task: DatabaseRow) => task._id || task.id;

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    if (activeDoc?.content) {
      const text = activeDoc.content.replace(/<[^>]*>/g, " ");
      setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
    }
  }, [activeDoc?.content]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") { e.preventDefault(); setIsSidebarOpen(p => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setIsSearchOpen(p => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") { e.preventDefault(); omnibarRef.current?.focus(); setIsOmnibarFocused(true); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") { e.preventDefault(); handleCreateDocument(); }
      if (e.key === "Escape") {
        setIsOmnibarFocused(false);
        setShowCoverPicker(false);
        setShowEmojiPicker(false);
        setShowStatusMenu(false);
        setShowPriorityMenu(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      abortControllerRef.current?.abort();
    };
  }, []);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch(apiUrl("/api/documents"), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDocuments(data);
          setActiveDoc(prev => {
            if (prev) {
              const matched = data.find(d => getDocId(d) === getDocId(prev));
              if (matched) return matched;
            }
            return data[0];
          });
        }
      }
    } catch { /* fallback to client state */ }
    finally {
      setIsLoadingDocs(false);
    }
  };

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await fetch(apiUrl("/api/tasks"), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDatabaseRows(data);
        }
      }
    } catch { /* fallback */ }
    finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchTasks();
  }, []);

  const persistDocumentPatch = (patch: Partial<WorkspaceDoc>) => {
    if (!activeDoc) return;
    const docId = getDocId(activeDoc);
    setActiveDoc(prev => prev ? { ...prev, ...patch } : null);
    setDocuments(prev => prev.map(d => getDocId(d) === docId ? { ...d, ...patch } : d));
    setSaveStatus("Saving...");

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/documents/${docId}`), {
          method: "PATCH",
          headers: getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const updated = await res.json();
          setDocuments(prev => prev.map(d => getDocId(d) === docId ? { ...d, ...updated } : d));
        }
      } catch { /* local */ }
      setSaveStatus("Saved");
    }, 800);
  };

  const handleContentChange = (newHtml: string) => {
    persistDocumentPatch({ content: newHtml });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    persistDocumentPatch({ title: e.target.value });
  };

  const handleToggleStar = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetDoc = documents.find(d => getDocId(d) === docId);
    if (!targetDoc) return;
    const newStarred = !targetDoc.isStarred;
    setDocuments(prev => prev.map(d => getDocId(d) === docId ? { ...d, isStarred: newStarred } : d));
    if (getDocId(activeDoc) === docId) {
      setActiveDoc(prev => prev ? { ...prev, isStarred: newStarred } : null);
    }
    try {
      await fetch(apiUrl(`/api/documents/${docId}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ isStarred: newStarred })
      });
    } catch { /* local */ }
  };

  const PAGE_TEMPLATES = [
    { icon: "📝", label: "Blank Page", tags: ["Draft"], content: "<p>Start writing your thoughts or press <b>/</b> for commands…</p>" },
    { icon: "📋", label: "Meeting Notes", tags: ["Meeting"], content: "<h2>Meeting Notes</h2><p><strong>Date:</strong> Today &nbsp; <strong>Attendees:</strong> —</p><h3>Agenda</h3><ul><li>Item 1</li><li>Item 2</li></ul><h3>Action Items</h3><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\">Follow up on deliverables</li></ul><h3>Notes</h3><p></p>" },
    { icon: "🚀", label: "Project Plan", tags: ["Project"], content: "<h2>Project Plan</h2><h3>Overview</h3><p>Brief description of the project and goals.</p><h3>Milestones</h3><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\">Define requirements</li><li data-type=\"taskItem\" data-checked=\"false\">Design system architecture</li><li data-type=\"taskItem\" data-checked=\"false\">Build MVP</li><li data-type=\"taskItem\" data-checked=\"false\">Launch</li></ul><h3>Resources</h3><p></p>" },
    { icon: "📚", label: "Wiki / Docs", tags: ["Wiki"], content: "<h1>Documentation</h1><p>This page is the authoritative reference for this topic.</p><h2>Overview</h2><p></p><h2>Details</h2><p></p><h2>FAQ</h2><details open=\"\"><summary>What is this?</summary><p>Answer here…</p></details>" },
    { icon: "📅", label: "Daily Journal", tags: ["Journal"], content: "<h2>📅 Daily Journal</h2><h3>🌤 Today's Focus</h3><ul data-type=\"taskList\"><li data-type=\"taskItem\" data-checked=\"false\">Priority task 1</li><li data-type=\"taskItem\" data-checked=\"false\">Priority task 2</li></ul><h3>💡 Ideas & Notes</h3><p></p><h3>🌙 End of Day Reflection</h3><p></p>" },
  ];

  const handleCreateDocument = async (template?: typeof PAGE_TEMPLATES[0], parentId?: string | null) => {
    const t = template ?? PAGE_TEMPLATES[0];
    const newDocPayload = {
      title: parentId ? `Untitled Sub-page` : `Untitled Document`,
      icon: t.icon,
      cover: COVER_PRESETS[Math.floor(Math.random() * COVER_PRESETS.length)],
      status: "In Progress" as const,
      priority: "Medium" as const,
      tags: t.tags,
      content: t.content,
      parentId: parentId ?? null,
    };
    try {
      const res = await fetch(apiUrl("/api/documents"), {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(newDocPayload)
      });
      if (res.ok) {
        const created = await res.json();
        setDocuments(prev => [created, ...prev]);
        setActiveDoc(created);
        // Auto-expand parent in sidebar
        if (parentId) setExpandedSidebarIds(prev => new Set([...prev, parentId]));
        return;
      }
    } catch { /* fallback */ }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(apiUrl(`/api/documents/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch { /* local */ }
    setDocuments(prev => {
      const remaining = prev.filter(d => getDocId(d) !== id);
      if (getDocId(activeDoc) === id) {
        setActiveDoc(remaining[0] ?? null);
      }
      return remaining;
    });
  };

  // ── Sprint Task Database Operations ──
  const handleCreateTask = async () => {
    const newTaskPayload = {
      name: "New Task Item",
      status: "In Progress" as const,
      priority: "Medium" as const,
      assignee: user?.name ? user.name.split(" ")[0] : "You",
      dueDate: "Tomorrow",
      progress: 0,
      documentId: activeDoc ? getDocId(activeDoc) : null,
    };
    try {
      const res = await fetch(apiUrl("/api/tasks"), {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(newTaskPayload),
      });
      if (res.ok) {
        const created = await res.json();
        setDatabaseRows(prev => [created, ...prev]);
        return;
      }
    } catch { /* fallback */ }
  };

  const handleUpdateTask = async (taskId: string, patch: Partial<DatabaseRow>) => {
    setDatabaseRows(prev => prev.map(t => (getTaskId(t) === taskId ? { ...t, ...patch } : t)));
    try {
      await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(patch),
      });
    } catch { /* local */ }
  };

  const handleDeleteTask = async (taskId: string) => {
    setDatabaseRows(prev => prev.filter(t => getTaskId(t) !== taskId));
    try {
      await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch { /* local */ }
  };

  const cycleStatus = (currentStatus: string): "In Progress" | "In Review" | "Done" | "Backlog" => {
    const list: ("In Progress" | "In Review" | "Done" | "Backlog")[] = ["In Progress", "In Review", "Done", "Backlog"];
    const idx = list.indexOf(currentStatus as any);
    return list[(idx + 1) % list.length];
  };

  const cyclePriority = (currentPriority: string): "Urgent" | "High" | "Medium" | "Low" => {
    const list: ("Urgent" | "High" | "Medium" | "Low")[] = ["Urgent", "High", "Medium", "Low"];
    const idx = list.indexOf(currentPriority as any);
    return list[(idx + 1) % list.length];
  };

  const handleStopAI = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAiLoading(false);
    }
  };

  const handleAiOmnibar = async (customPrompt?: string, mode: string = "transform") => {
    const promptText = customPrompt || omnibarQuery;
    if (!promptText.trim() || !activeDoc || isAiLoading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsAiLoading(true);
    setOmnibarQuery("");
    setIsOmnibarFocused(false);
    setAiPanelOutput("");

    try {
      let accumulatedTotal = "";
      const baseContent = activeDoc.content;
      await streamAiToEditor({
        prompt: promptText,
        selectedText: activeDoc.content.replace(/<[^>]*>/g, " ").slice(0, 1000),
        documentTitle: activeDoc.title,
        mode,
        signal: controller.signal,
        onChunk: (chunk: string) => {
          accumulatedTotal += chunk;
          setActiveDoc(prev => prev ? { ...prev, content: prev.content + chunk } : null);
          setAiPanelOutput(prev => (prev || "") + chunk);
        },
        onComplete: (fullText: string) => {
          const finalAdded = fullText || accumulatedTotal;
          setIsAiLoading(false);
          abortControllerRef.current = null;
          if (finalAdded) {
            persistDocumentPatch({ content: baseContent + "<br/>" + finalAdded });
          }
        },
        onError: () => {
          setIsAiLoading(false);
          abortControllerRef.current = null;
        },
      });
    } catch { /* cancelled */ }
  };

  const handleShareClick = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2200);
  };

  const searchItems: SearchDocItem[] = documents.map(d => ({
    id: getDocId(d), title: d.title, icon: d.icon,
    preview: d.content.replace(/<[^>]*>/g, " ").slice(0, 80) + "…",
  }));

  const userInitials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AC";

  const filteredRows = dbFilterStatus === "All"
    ? databaseRows
    : databaseRows.filter(r => r.status === dbFilterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Done":
        return { color: C.emerald, bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)" };
      case "In Progress":
        return { color: C.amber, bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)" };
      case "In Review":
        return { color: C.cobaltGlow, bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.3)" };
      default:
        return { color: C.textTertiary, bg: "rgba(255, 255, 255, 0.05)", border: C.border };
    }
  };

  // ── Sidebar Document Row Item (Notion-style nested tree) ──
  const SidebarItem = ({ doc, depth = 0 }: { doc: WorkspaceDoc; depth?: number }) => {
    const isActive = getDocId(activeDoc) === getDocId(doc);
    const id = getDocId(doc);
    const subPages = documents.filter(d => d.parentId === id && getDocId(d) !== id);
    const isExpanded = expandedSidebarIds.has(id);

    return (
      <div>
        <div
          className="group relative"
          onMouseEnter={() => setHoveredDocId(id)}
          onMouseLeave={() => setHoveredDocId(null)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: `5px 10px 5px ${10 + depth * 14}px`,
            borderRadius: 6, cursor: "pointer",
            marginBottom: 1, transition: "background 0.12s",
            background: isActive ? "rgba(255, 255, 255, 0.07)" : hoveredDocId === id ? "rgba(255, 255, 255, 0.03)" : "transparent",
          }}
        >
          {/* Expand/collapse arrow for sub-pages */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedSidebarIds(prev => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
              });
            }}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: "0 1px",
              color: subPages.length > 0 ? C.textTertiary : "transparent",
              display: "flex", alignItems: "center", flexShrink: 0,
              transition: "transform 0.12s",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            <ChevronRight size={10} />
          </button>

          {/* Doc icon + title — clicking selects it */}
          <div
            onClick={() => setActiveDoc(doc)}
            style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, overflow: "hidden", minWidth: 0 }}
          >
            <span style={{ fontSize: 13, flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>{doc.icon ?? "📄"}</span>
            <span style={{
              flex: 1, fontSize: 12.5, fontWeight: isActive ? 500 : 400,
              color: isActive ? C.textPrimary : C.textSecondary,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>
              {doc.title}
            </span>
          </div>

          {/* Hover actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, opacity: hoveredDocId === id || isActive ? 1 : 0, transition: "opacity 0.1s" }}>
            {doc.isStarred && <Star size={10} style={{ color: C.amber, fill: C.amber, flexShrink: 0 }} />}
            {/* Add sub-page */}
            <button
              onClick={(e) => { e.stopPropagation(); handleCreateDocument(PAGE_TEMPLATES[0], id); }}
              title="Add sub-page"
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 2, borderRadius: 3, display: "flex", alignItems: "center" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
              onMouseLeave={e => (e.currentTarget.style.color = C.textTertiary)}
            >
              <Plus size={10} />
            </button>
            {/* Star toggle */}
            <button
              onClick={(e) => handleToggleStar(id, e)}
              style={{ background: "none", border: "none", cursor: "pointer", color: doc.isStarred ? C.amber : C.textTertiary, padding: 2, borderRadius: 3, display: "flex", alignItems: "center" }}
            >
              <Star size={10} className={doc.isStarred ? "fill-amber-400" : ""} />
            </button>
            {/* Delete */}
            <button
              onClick={(e) => handleDeleteDocument(e, id)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 2, borderRadius: 3, display: "flex", alignItems: "center", opacity: 0.6 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>

        {/* Sub-pages (nested) */}
        {isExpanded && subPages.map(sub => (
          <SidebarItem key={getDocId(sub)} doc={sub} depth={depth + 1} />
        ))}
      </div>
    );
  };

  // Only show root-level docs (no parentId) in the main list
  const rootDocs = documents.filter(d => !d.parentId);

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, color: C.textPrimary, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: "hidden" }}>

      {/* ══ 1. SIDEBAR (LINEAR/NOTION HYBRID CRAFT) ══ */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }} animate={{ width: 250, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            style={{ flexShrink: 0, height: "100vh", background: C.sidebar, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Workspace Header */}
            <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 6px", borderRadius: 6, transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.muted)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: C.cobalt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white" }}>CS</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, letterSpacing: "-0.01em" }}>CogniSpace HQ</span>
                  <ChevronDown size={11} style={{ color: C.textTertiary }} />
                </div>
                <button onClick={() => setIsSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 4, borderRadius: 6, display: "flex", alignItems: "center", transition: "color 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)} onMouseLeave={e => (e.currentTarget.style.color = C.textTertiary)}>
                  <PanelLeftClose size={14} />
                </button>
              </div>

              {/* ⌘K Search trigger */}
              <button onClick={() => setIsSearchOpen(true)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 9px", borderRadius: 6, background: "rgba(255, 255, 255, 0.03)", border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.06)"; (e.currentTarget as HTMLButtonElement).style.borderColor = C.borderFocus; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255, 255, 255, 0.03)"; (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
              >
                <Search size={13} style={{ color: C.textSecondary }} />
                <span style={{ fontSize: 12, color: C.textSecondary, flex: 1, textAlign: "left" }}>Search pages...</span>
                <kbd style={{ fontSize: 9.5, padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`, color: C.textTertiary, fontFamily: "monospace" }}>⌘K</kbd>
              </button>
            </div>

            {/* Sidebar Navigation Tree */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>

              {/* Quick Jump Links */}
              <div style={{ marginBottom: 14 }}>
                {[
                  { icon: <Clock size={13} />, label: "Recent Updates" },
                  { icon: <Layers size={13} />, label: "Teamspaces" },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 9px", borderRadius: 6, cursor: "pointer", fontSize: 12.5, color: C.textSecondary, marginBottom: 1, transition: "background 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.muted; e.currentTarget.style.color = C.textPrimary; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSecondary; }}>
                    {icon}
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Favorites Section */}
              {documents.some(d => d.isStarred) && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: C.amber, padding: "0 9px 4px", fontWeight: 700 }}>
                    Favorites
                  </div>
                  {documents.filter(d => d.isStarred).map(doc => (
                    <SidebarItem key={`fav-${getDocId(doc)}`} doc={doc} />
                  ))}
                </div>
              )}

              {/* Workspace Documents Header */}
              <div style={{ marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 9px" }}>
                <span style={{ fontSize: 10, fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: C.textTertiary, fontWeight: 700 }}>
                  Pages ({documents.length})
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* Template picker */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowTemplateMenu(v => !v)}
                      title="New page from template"
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, display: "flex", alignItems: "center", padding: 2, borderRadius: 4, transition: "color 0.12s" }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)} onMouseLeave={e => (e.currentTarget.style.color = C.textSecondary)}>
                      <Layers size={12} />
                    </button>
                    {showTemplateMenu && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", right: 0,
                        background: C.cardElevated, border: `1px solid ${C.border}`,
                        borderRadius: 8, padding: 4, zIndex: 60, minWidth: 170,
                        boxShadow: "0 12px 32px rgba(0,0,0,0.7)"
                      }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 8px 6px" }}>Templates</div>
                        {PAGE_TEMPLATES.map(t => (
                          <button key={t.label} onClick={() => { setShowTemplateMenu(false); handleCreateDocument(t); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "5px 8px", background: "none", border: "none", cursor: "pointer", borderRadius: 5, fontSize: 11.5, color: C.textSecondary, textAlign: "left" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = C.textPrimary; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.textSecondary; }}
                          >
                            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleCreateDocument()} style={{ background: "none", border: "none", cursor: "pointer", color: C.textSecondary, display: "flex", alignItems: "center", padding: 2, borderRadius: 4, transition: "color 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)} onMouseLeave={e => (e.currentTarget.style.color = C.textSecondary)}>
                    <Plus size={13} />
                  </button>
                </div>
              </div>

              {/* Documents List (root level only, nested inside SidebarItem) */}
              {isLoadingDocs ? (
                <div style={{ padding: "12px 9px", color: C.textTertiary, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={12} className="animate-spin text-indigo-400" />
                  <span>Loading workspace...</span>
                </div>
              ) : rootDocs.length === 0 ? (
                <div style={{ padding: "12px 9px", color: C.textTertiary, fontSize: 11 }}>
                  No pages yet. Click + to create one.
                </div>
              ) : (
                rootDocs.map(doc => <SidebarItem key={getDocId(doc)} doc={doc} />)
              )}
            </div>

            {/* User Footer Profile & Settings */}
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowUserMenu(v => !v)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "6px 8px", borderRadius: 6, background: "transparent", border: "none", cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.muted)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.cobalt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800, color: "white", flexShrink: 0 }}>
                    {userInitials}
                  </div>
                  <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.name ?? "Acme Engineering"}
                    </div>
                    <div style={{ fontSize: 10.5, color: C.textTertiary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.email ?? "team@acme.ai"}
                    </div>
                  </div>
                  <MoreHorizontal size={13} style={{ color: C.textTertiary, flexShrink: 0 }} />
                </button>

                {showUserMenu && (
                  <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.6)", zIndex: 50 }}>
                    {onBackToLanding && (
                      <button onClick={() => { setShowUserMenu(false); onBackToLanding(); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textSecondary, borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <ArrowRight size={13} /> Back to Landing Page
                      </button>
                    )}
                    <button onClick={() => { setShowUserMenu(false); onLogout?.(); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.rose }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(244,63,94,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <LogOut size={13} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══ 2. WORKSPACE CANVAS (SUB-MILLISECOND LINEAR FEEL) ══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: C.canvas }}>

        {/* ── Top Header Bar ── */}
        <header style={{
          height: 48, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", borderBottom: `1px solid ${C.border}`,
          background: `${C.canvas}f2`, backdropFilter: "blur(12px)", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textTertiary, padding: 4, borderRadius: 6, display: "flex", alignItems: "center" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)} onMouseLeave={e => (e.currentTarget.style.color = C.textTertiary)}>
                <PanelLeftOpen size={15} />
              </button>
            )}

            {/* Breadcrumb Path */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: C.textTertiary }}>
              {onBackToLanding && (
                <span onClick={onBackToLanding} style={{ cursor: "pointer", color: C.textSecondary }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.textSecondary)}>
                  Home
                </span>
              )}
              {onBackToLanding && <ChevronRight size={11} />}
              <span>Acme HQ</span>
              <ChevronRight size={11} />
              <span style={{ color: C.textPrimary, fontWeight: 500 }}>{activeDoc?.title ?? "Untitled"}</span>
            </div>
          </div>

          {/* Center: Linear/Notion View Switcher */}
          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.04)", borderRadius: 6, padding: 2, border: `1px solid ${C.border}` }}>
            {[
              { id: "doc", label: "Document", icon: <FileText size={12} /> },
              { id: "database", label: "Sprint Table", icon: <Table size={12} /> },
              { id: "ai", label: "AI Inspector", icon: <Bot size={12} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 4, fontSize: 11.5, fontWeight: 500,
                  border: "none", cursor: "pointer", transition: "all 0.12s",
                  background: activeView === tab.id ? C.cobalt : "transparent",
                  color: activeView === tab.id ? "#ffffff" : C.textSecondary
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Right Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Live Multiplayer Presence */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {[
                  { initials: "MK", bg: "bg-indigo-600", name: "Mia K." },
                  { initials: "KT", bg: "bg-cyan-600", name: "Kenji T." }
                ].map((av, idx) => (
                  <div key={idx} title={`${av.name} is editing`}
                    className={`w-5 h-5 rounded-full ${av.bg} flex items-center justify-center text-[9px] font-bold text-white border border-[#10121b]`}
                    style={{ marginLeft: idx > 0 ? -5 : 0 }}>
                    {av.initials}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: C.emerald, background: "rgba(16, 185, 129, 0.1)", padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                ● 18ms
              </div>
            </div>

            <div style={{ width: 1, height: 14, background: C.border }} />

            {/* Autosave Status Indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontFamily: "monospace", color: saveStatus === "Saved" ? C.emerald : saveStatus === "Saving..." ? C.amber : C.rose }}>
              {saveStatus === "Saved" ? <Check size={11} /> : saveStatus === "Saving..." ? <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} /> : null}
              <span>{saveStatus}</span>
            </div>

            <div style={{ width: 1, height: 14, background: C.border }} />

            {/* Share Link Action */}
            <button
              onClick={handleShareClick}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 8px", borderRadius: 5, fontSize: 11.5, fontWeight: 500,
                background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                color: C.textSecondary, cursor: "pointer", transition: "all 0.12s"
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.textPrimary; e.currentTarget.style.borderColor = C.borderFocus; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.borderColor = C.border; }}
            >
              <Share2 size={12} />
              <span>Share</span>
            </button>

            {/* Ask AI Action */}
            <button onClick={() => { omnibarRef.current?.focus(); setIsOmnibarFocused(true); }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 12px", fontSize: 11.5, fontWeight: 600,
                color: "#ffffff", background: C.cobalt,
                border: "none", borderRadius: 6, cursor: "pointer",
                transition: "background 0.12s"
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.cobaltGlow)}
              onMouseLeave={e => (e.currentTarget.style.background = C.cobalt)}>
              <Sparkles size={12} /> Ask AI
            </button>
          </div>
        </header>

        {/* ── Share Copied Notification Toast ── */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              style={{
                position: "absolute", top: 56, right: 24, zIndex: 100,
                padding: "7px 14px", borderRadius: 6,
                background: C.card, border: `1px solid ${C.borderFocus}`,
                color: C.textPrimary, fontSize: 11.5, fontWeight: 500,
                boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", gap: 6
              }}
            >
              <CheckCheck size={13} style={{ color: C.emerald }} />
              <span>Link copied to clipboard</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ 3. DYNAMIC WORKSPACE CONTENT ══ */}
        {activeDoc ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

            {/* ── Cover Image Banner ── */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ height: 150, background: activeDoc.cover ?? COVER_PRESETS[0], position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(16,18,27,0.95) 100%)" }} />
              </div>

              {/* Cover Controls */}
              <div style={{ position: "absolute", top: 12, right: 16 }}>
                <button
                  onClick={() => setShowCoverPicker(v => !v)}
                  style={{
                    padding: "4px 8px", fontSize: 11, fontWeight: 500,
                    color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5,
                    cursor: "pointer", backdropFilter: "blur(6px)"
                  }}
                >
                  Change cover
                </button>
              </div>

              {/* Cover Picker Popover */}
              {showCoverPicker && (
                <div style={{
                  position: "absolute", top: 42, right: 16, background: C.card,
                  border: `1px solid ${C.border}`, borderRadius: 8, padding: 8,
                  display: "flex", gap: 6, boxShadow: "0 12px 32px rgba(0,0,0,0.7)", zIndex: 20
                }}>
                  {COVER_PRESETS.map((cover, i) => (
                    <div key={i} onClick={() => { persistDocumentPatch({ cover }); setShowCoverPicker(false); }}
                      style={{ width: 48, height: 30, borderRadius: 5, background: cover, cursor: "pointer", border: `1.5px solid ${activeDoc.cover === cover ? C.cobalt : "transparent"}` }} />
                  ))}
                </div>
              )}

              {/* Document Icon & Emoji Popover */}
              <div style={{ position: "absolute", bottom: -20, left: "max(48px, 6%)", zIndex: 10 }}>
                <div
                  onClick={() => setShowEmojiPicker(v => !v)}
                  style={{ fontSize: 40, lineHeight: 1, cursor: "pointer", transition: "transform 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.08)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                >
                  {activeDoc.icon ?? "🚀"}
                </div>

                {showEmojiPicker && (
                  <div style={{
                    position: "absolute", top: 46, left: 0,
                    background: C.cardElevated, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: 8, display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 6, boxShadow: "0 16px 40px rgba(0,0,0,0.8)", zIndex: 30
                  }}>
                    {EMOJI_PALETTE.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => {
                          persistDocumentPatch({ icon: emoji });
                          setShowEmojiPicker(false);
                        }}
                        style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 5 }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Document Content Canvas */}
            <div style={{ flex: 1, maxWidth: 820, width: "100%", margin: "0 auto", padding: "44px 40px 140px", display: "flex", flexDirection: "column" }}>

              {/* Document Title Input */}
              <input
                value={activeDoc.title}
                onChange={handleTitleChange}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  fontSize: 34, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em",
                  lineHeight: 1.15, marginBottom: 12, padding: 0, outline: "none", fontFamily: "inherit"
                }}
                placeholder="Untitled"
              />

              {/* ── Precision Properties Sheet (Linear / Notion Hybrid) ── */}
              <div style={{
                borderRadius: 8, padding: "10px 14px",
                background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
                marginBottom: 24, display: "flex", flexDirection: "column", gap: 8
              }}>
                {/* Status Property */}
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ color: C.textTertiary, display: "flex", alignItems: "center", gap: 6 }}>
                    <Tag size={12} /> Status
                  </span>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowStatusMenu(v => !v)}
                      style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                        ...getStatusBadge(activeDoc.status || "In Progress"),
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                      }}
                    >
                      <span>{activeDoc.status || "In Progress"}</span>
                      <ChevronDown size={10} />
                    </button>
                    {showStatusMenu && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0,
                        background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 6, padding: 4, zIndex: 40, boxShadow: "0 8px 24px rgba(0,0,0,0.6)"
                      }}>
                        {["Backlog", "In Progress", "In Review", "Done"].map(st => (
                          <div
                            key={st}
                            onClick={() => {
                              persistDocumentPatch({ status: st as any });
                              setShowStatusMenu(false);
                            }}
                            style={{
                              padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer",
                              color: C.textPrimary, transition: "background 0.12s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          >
                            {st}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority Property */}
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ color: C.textTertiary, display: "flex", alignItems: "center", gap: 6 }}>
                    <SlidersHorizontal size={12} /> Priority
                  </span>
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShowPriorityMenu(v => !v)}
                      style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                        background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
                        color: activeDoc.priority === "Urgent" ? C.amber : C.textSecondary,
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4
                      }}
                    >
                      <span>{activeDoc.priority || "Medium"}</span>
                      <ChevronDown size={10} />
                    </button>
                    {showPriorityMenu && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", left: 0,
                        background: C.card, border: `1px solid ${C.border}`,
                        borderRadius: 6, padding: 4, zIndex: 40, boxShadow: "0 8px 24px rgba(0,0,0,0.6)"
                      }}>
                        {["Low", "Medium", "High", "Urgent"].map(pr => (
                          <div
                            key={pr}
                            onClick={() => {
                              persistDocumentPatch({ priority: pr as any });
                              setShowPriorityMenu(false);
                            }}
                            style={{
                              padding: "4px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer",
                              color: C.textPrimary, transition: "background 0.12s"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}
                          >
                            {pr}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignee Property */}
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ color: C.textTertiary, display: "flex", alignItems: "center", gap: 6 }}>
                    <User size={12} /> Assignee
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textSecondary }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.cobalt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "white" }}>MK</div>
                    <span>Mia K. (Engineering Lead)</span>
                  </div>
                </div>

                {/* Tags Property */}
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "flex-start", gap: 8, fontSize: 12 }}>
                  <span style={{ color: C.textTertiary, display: "flex", alignItems: "center", gap: 6, paddingTop: 2 }}>
                    <Tag size={12} /> Tags
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
                    {(activeDoc.tags ?? []).map(tag => (
                      <span key={tag}
                        onClick={() => persistDocumentPatch({ tags: (activeDoc.tags ?? []).filter(t => t !== tag) })}
                        title="Click to remove tag"
                        style={{
                          padding: "1px 7px", borderRadius: 99, fontSize: 10.5, fontWeight: 500,
                          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                          color: C.cobaltGlow, cursor: "pointer", transition: "background 0.12s"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.12)")}>
                        {tag} ×
                      </span>
                    ))}
                    {showTagEditor ? (
                      <input
                        autoFocus
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && tagInput.trim()) {
                            const newTags = [...(activeDoc.tags ?? []).filter(t => t !== tagInput.trim()), tagInput.trim()];
                            persistDocumentPatch({ tags: newTags });
                            setTagInput(""); setShowTagEditor(false);
                          }
                          if (e.key === 'Escape') { setTagInput(""); setShowTagEditor(false); }
                        }}
                        onBlur={() => { setTagInput(""); setShowTagEditor(false); }}
                        placeholder="Add tag…"
                        style={{ border: `1px solid ${C.borderFocus}`, borderRadius: 99, padding: "1px 8px", fontSize: 10.5, background: C.card, color: C.textPrimary, outline: "none", width: 90 }}
                      />
                    ) : (
                      <button onClick={() => setShowTagEditor(true)}
                        style={{ padding: "1px 7px", borderRadius: 99, fontSize: 10.5, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.textTertiary, cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
                        onMouseLeave={e => (e.currentTarget.style.color = C.textTertiary)}>
                        + Add tag
                      </button>
                    )}
                  </div>
                </div>

                {/* Timestamp & Words */}
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ color: C.textTertiary, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={12} /> Last edited
                  </span>
                  <span style={{ fontSize: 11.5, color: C.textTertiary, fontFamily: "monospace" }}>
                    Just now · {wordCount} words · {Math.max(1, Math.ceil(wordCount / 200))} min read
                  </span>
                </div>
              </div>

              {/* ══ VIEW 1: DOCUMENT MODE ══ */}
              {activeView === "doc" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

                  {/* Contextual Action Bar */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
                    borderRadius: 6, background: "rgba(255, 255, 255, 0.02)", border: `1px solid ${C.border}`,
                    marginBottom: 18, fontSize: 11.5, color: C.textTertiary
                  }}>
                    <span style={{ fontWeight: 600, color: C.textSecondary }}>Quick Actions:</span>
                    {[
                      { label: "💡 Key Insight", action: () => handleAiOmnibar("Insert an engineering key takeaway callout box") },
                      { label: "☑️ Sprint Tasks", action: () => handleAiOmnibar("Insert an actionable sprint to-do checklist") },
                      { label: "💻 Code Block", action: () => handleAiOmnibar("Insert TypeScript delta sync engine code snippet") },
                      { label: "✨ Ask AI", action: () => { omnibarRef.current?.focus(); setIsOmnibarFocused(true); } }
                    ].map(b => (
                      <button
                        key={b.label}
                        onClick={b.action}
                        style={{
                          padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                          background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                          color: C.textSecondary, cursor: "pointer", transition: "all 0.12s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = C.textPrimary; e.currentTarget.style.borderColor = C.borderFocus; }}
                        onMouseLeave={e => { e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.borderColor = C.border; }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  {/* Rich TipTap Block Canvas */}
                  <div style={{ flex: 1, fontSize: 15, lineHeight: 1.7, color: "#d1d5db" }}>
                    <BlockEditor
                      key={getDocId(activeDoc)}
                      content={activeDoc.content}
                      onChange={handleContentChange}
                      onAskAI={(selected) => {
                        setOmnibarQuery(selected ? `Improve this text: "${selected}"` : "");
                        setIsOmnibarFocused(true);
                        omnibarRef.current?.focus();
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ══ VIEW 2: DATABASE TABLE MODE ══ */}
              {activeView === "database" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Table size={14} style={{ color: C.cobaltGlow }} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary }}>Sprint Deliverables & Issues</span>
                      <span style={{ fontSize: 11, background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4, color: C.textTertiary }}>
                        {filteredRows.length} items
                      </span>
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Filter size={11} style={{ color: C.textTertiary }} />
                      {["All", "In Progress", "Done", "In Review"].map(status => (
                        <button
                          key={status}
                          onClick={() => setDbFilterStatus(status)}
                          style={{
                            padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500,
                            background: dbFilterStatus === status ? C.cobalt : "transparent",
                            color: dbFilterStatus === status ? "#ffffff" : C.textTertiary,
                            border: `1px solid ${dbFilterStatus === status ? C.cobalt : C.border}`,
                            cursor: "pointer"
                          }}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Database Table Container */}
                  <div style={{ borderRadius: 6, border: `1px solid ${C.border}`, overflow: "hidden", background: "rgba(12,14,21,0.6)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(255,255,255,0.02)", color: C.textTertiary, fontSize: 11 }}>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Issue / Task</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Status</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Priority</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Assignee</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Due</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500 }}>Progress</th>
                          <th style={{ padding: "8px 12px", fontWeight: 500, width: 40, textAlign: "center" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingTasks ? (
                          <tr>
                            <td colSpan={7} style={{ padding: "28px 12px", textAlign: "center", color: C.textTertiary, fontSize: 12 }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <RefreshCw size={14} className="animate-spin text-indigo-400" />
                                <span>Loading sprint tasks from database...</span>
                              </div>
                            </td>
                          </tr>
                        ) : filteredRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ padding: "28px 12px", textAlign: "center", color: C.textTertiary, fontSize: 12 }}>
                              No tasks match the filter. Click <strong>+ Add issue</strong> below to create one.
                            </td>
                          </tr>
                        ) : (
                          filteredRows.map(row => {
                            const badge = getStatusBadge(row.status);
                            const rowId = getTaskId(row);
                            return (
                              <tr key={rowId} style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.12s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <td style={{ padding: "6px 12px", color: C.textPrimary, fontWeight: 500 }}>
                                  <input
                                    defaultValue={row.name}
                                    onBlur={(e) => {
                                      const val = e.target.value.trim();
                                      if (val && val !== row.name) handleUpdateTask(rowId, { name: val });
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                    }}
                                    style={{
                                      background: "transparent", border: "none", outline: "none",
                                      color: C.textPrimary, fontSize: 12, fontWeight: 500, width: "100%",
                                      padding: "3px 4px", borderRadius: 4,
                                    }}
                                    className="focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/40"
                                  />
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  <button
                                    onClick={() => handleUpdateTask(rowId, { status: cycleStatus(row.status) })}
                                    title="Click to cycle status"
                                    style={{
                                      padding: "2px 7px", borderRadius: 4, fontSize: 10.5, fontWeight: 500,
                                      color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`,
                                      cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4,
                                    }}
                                  >
                                    {row.status}
                                  </button>
                                </td>
                                <td style={{ padding: "9px 12px" }}>
                                  <button
                                    onClick={() => handleUpdateTask(rowId, { priority: cyclePriority(row.priority) })}
                                    title="Click to cycle priority"
                                    style={{
                                      background: "transparent", border: "none", cursor: "pointer",
                                      fontSize: 11, fontWeight: 500,
                                      color: row.priority === "Urgent" ? C.amber : row.priority === "High" ? C.rose : C.textSecondary,
                                      display: "inline-flex", alignItems: "center", gap: 3
                                    }}
                                  >
                                    {row.priority}
                                  </button>
                                </td>
                                <td style={{ padding: "9px 12px", color: C.textSecondary }}>{row.assignee}</td>
                                <td style={{ padding: "9px 12px", color: C.textTertiary, fontFamily: "monospace", fontSize: 11 }}>{row.dueDate}</td>
                                <td style={{ padding: "9px 12px" }}>
                                  <div
                                    style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                                    title="Click to increment progress"
                                    onClick={() => {
                                      const nextProg = row.progress >= 100 ? 0 : Math.min(100, row.progress + 25);
                                      const nextStatus = nextProg === 100 ? "Done" : row.status === "Done" ? "In Progress" : row.status;
                                      handleUpdateTask(rowId, { progress: nextProg, status: nextStatus });
                                    }}
                                  >
                                    <div style={{ width: 50, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                                      <div style={{ width: `${row.progress}%`, height: "100%", background: row.progress === 100 ? C.emerald : C.cobalt, transition: "width 0.2s" }} />
                                    </div>
                                    <span style={{ fontSize: 10, color: C.textTertiary }}>{row.progress}%</span>
                                  </div>
                                </td>
                                <td style={{ padding: "9px 12px", textAlign: "center" }}>
                                  <button
                                    onClick={() => handleDeleteTask(rowId)}
                                    title="Delete task from database"
                                    style={{
                                      background: "transparent", border: "none", color: C.textTertiary,
                                      cursor: "pointer", padding: 3, borderRadius: 4, display: "inline-flex", alignItems: "center",
                                    }}
                                    className="hover:text-red-400 hover:bg-red-500/10"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row Action */}
                  <button
                    onClick={handleCreateTask}
                    style={{
                      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                      borderRadius: 6, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
                      color: C.textSecondary, fontSize: 11.5, fontWeight: 500, cursor: "pointer", width: "fit-content"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = C.textPrimary; e.currentTarget.style.borderColor = C.borderFocus; }}
                    onMouseLeave={e => { e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.borderColor = C.border; }}
                  >
                    <Plus size={12} /> Add issue
                  </button>
                </div>
              )}

              {/* ══ VIEW 3: AI INSPECTOR & AGENT WORKSPACE ══ */}
              {activeView === "ai" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, display: "flex", alignItems: "center", gap: 6 }}>
                      <Bot size={15} style={{ color: C.cobaltGlow }} /> CogniSpace AI Inspector · Gemini 2.5 Flash
                    </span>
                    <span style={{ fontSize: 10.5, fontFamily: "monospace", color: C.emerald, background: "rgba(16, 185, 129, 0.1)", padding: "2px 7px", borderRadius: 4, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                      16.4ms stream latency
                    </span>
                  </div>

                  {/* Quick Action Prompt Chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      "⚡ Executive Summary",
                      "📋 Extract 3 Action Items",
                      "🛠️ Technical RFC Draft",
                      "✨ Polish Tone & Brevity"
                    ].map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => handleAiOmnibar(prompt)}
                        style={{
                          padding: "5px 11px", borderRadius: 5, fontSize: 11.5, fontWeight: 500,
                          background: "rgba(99, 102, 241, 0.08)", border: `1px solid ${C.borderFocus}`,
                          color: C.textPrimary, cursor: "pointer", transition: "all 0.12s"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.18)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.08)")}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Stream Response Box */}
                  <div style={{
                    padding: 16, borderRadius: 8,
                    background: "rgba(12, 14, 21, 0.8)",
                    border: `1px solid ${C.border}`, fontSize: 12.5, lineHeight: 1.6, color: C.textPrimary
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 600, color: C.textSecondary, marginBottom: 8, fontSize: 11.5 }}>
                      <Sparkles size={13} style={{ color: C.cobaltGlow }} />
                      <span>Copilot Thought Stream & Synthesis:</span>
                    </div>
                    <div
                      className="prose prose-invert max-w-none text-xs text-zinc-300 leading-relaxed"
                      style={{ margin: 0, fontFamily: "Inter, sans-serif" }}
                      dangerouslySetInnerHTML={{
                        __html: aiPanelOutput || "<p style='color: #64748b;'>Select any prompt chip above or type in the bottom command bar (⌘J) to stream AI completions directly into this document.</p>"
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          /* Empty Workspace State */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: C.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={24} style={{ color: C.textTertiary }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>No document selected</h3>
              <p style={{ fontSize: 13, color: C.textTertiary, marginBottom: 16 }}>Select a page from the sidebar or create a new document</p>
              <button onClick={() => handleCreateDocument()}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12.5, fontWeight: 500, color: "#ffffff", background: C.cobalt, border: "none", borderRadius: 6, cursor: "pointer", margin: "0 auto" }}>
                <Plus size={14} /> New document
              </button>
            </div>
          </div>
        )}

        {/* ══ 4. BOTTOM FLOATING AI OMNIBAR (⌘J) ══ */}
        <div style={{
          position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
          width: "min(640px, 90vw)", zIndex: 40,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
            background: isOmnibarFocused ? C.cardElevated : "rgba(14, 16, 24, 0.94)",
            border: `1px solid ${isOmnibarFocused ? C.cobaltGlow : C.border}`,
            borderRadius: 10, backdropFilter: "blur(16px)",
            boxShadow: isOmnibarFocused ? "0 8px 32px rgba(0,0,0,0.6)" : "0 4px 20px rgba(0,0,0,0.4)",
            transition: "all 0.15s",
          }}>
            {isAiLoading
              ? <RefreshCw size={15} style={{ color: C.cobaltGlow, animation: "spin 1s linear infinite", flexShrink: 0 }} />
              : <Sparkles size={15} style={{ color: isOmnibarFocused ? C.cobaltGlow : C.textTertiary, flexShrink: 0 }} />
            }
            <input
              ref={omnibarRef}
              value={omnibarQuery}
              onChange={e => setOmnibarQuery(e.target.value)}
              onFocus={() => setIsOmnibarFocused(true)}
              onBlur={() => { if (!omnibarQuery) setIsOmnibarFocused(false); }}
              onKeyDown={e => {
                if (e.key === "Enter") handleAiOmnibar();
                if (e.key === "Escape") { setIsOmnibarFocused(false); setOmnibarQuery(""); omnibarRef.current?.blur(); }
              }}
              placeholder={isAiLoading ? "AI is generating document updates…" : "Ask AI to edit, summarize, or generate tasks… (⌘J)"}
              disabled={isAiLoading}
              style={{ flex: 1, background: "transparent", border: "none", fontSize: 13, color: C.textPrimary, outline: "none", fontFamily: "inherit" }}
            />
            {isAiLoading && (
              <button
                onClick={handleStopAI}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.18)",
                  color: "#f87171",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
                title="Stop AI generation (Abort)"
              >
                <Square size={10} fill="#f87171" /> Stop
              </button>
            )}
            {omnibarQuery && !isAiLoading && (
              <kbd
                onClick={() => handleAiOmnibar()}
                style={{ fontSize: 9.5, padding: "2px 6px", borderRadius: 4, background: C.cobalt, color: "#ffffff", fontFamily: "monospace", border: "none", flexShrink: 0, cursor: "pointer", fontWeight: 600 }}>
                ↵ Send
              </kbd>
            )}
            {!omnibarQuery && !isAiLoading && (
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <kbd style={{ fontSize: 9.5, padding: "2px 5px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: C.textTertiary, fontFamily: "monospace", border: `1px solid ${C.border}` }}>
                  ⌘J
                </kbd>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Search Modal ── */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        documents={searchItems}
        onSelectDoc={(item) => {
          const doc = documents.find(d => getDocId(d) === item.id);
          if (doc) { setActiveDoc(doc); setIsSearchOpen(false); }
        }}
      />
    </div>
  );
};

export default WorkspaceDashboard;
