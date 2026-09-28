import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Heading1, Heading2, Heading3, List, Code, Sparkles, 
  CheckSquare, ChevronRight, Quote
} from 'lucide-react';

interface BlockEditorProps {
  content: string;
  onChange: (html: string) => void;
  onAskAI: (selectedText: string) => void;
}

// ── Toggle Block State (local, per-editor-instance) ──────────────────────────
// Since Tiptap StarterKit doesn't have a native "details" extension, we
// render toggle blocks as native <details> which Tiptap can parse.
// The sidebar toggle is managed separately in WorkspaceDashboard.

export const BlockEditor: React.FC<BlockEditorProps> = ({
  content,
  onChange,
  onAskAI,
}) => {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionMenuPos, setSelectionMenuPos] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {
          HTMLAttributes: { class: 'list-disc list-outside pl-5 space-y-0.5 text-zinc-300 my-2' },
        },
        orderedList: {
          HTMLAttributes: { class: 'list-decimal list-outside pl-5 space-y-0.5 text-zinc-300 my-2' },
        },
        blockquote: {
          HTMLAttributes: { class: 'border-l-2 border-indigo-500 pl-4 py-1 italic text-zinc-400 my-3 bg-indigo-950/10 rounded-r-lg' },
        },
        codeBlock: {
          HTMLAttributes: { class: 'rounded-xl bg-zinc-900 border border-zinc-800 p-4 font-mono text-xs text-zinc-200 overflow-x-auto my-3' },
        },
      }),
      TaskList.configure({
        HTMLAttributes: { class: 'space-y-1.5 my-2 not-prose pl-0' },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: { class: 'flex items-start gap-2 text-sm text-zinc-300' },
      }),
      Placeholder.configure({
        placeholder: "Press '/' for commands — headings, lists, toggles, tasks, code...",
      }),
    ],
    content: content || '<p>Start writing your thoughts...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[420px] text-zinc-200 text-base leading-relaxed selection:bg-indigo-500/30 font-sans',
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/') {
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          setMenuPosition({ top: coords.bottom + 8, left: Math.min(coords.left, window.innerWidth - 300) });
          setShowSlashMenu(true);
        } else if (event.key === 'Escape') {
          setShowSlashMenu(false);
          setShowSelectionMenu(false);
        }
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, ' ');
        if (text.trim().length > 0) {
          const coords = editor.view.coordsAtPos(from);
          setSelectedText(text);
          setSelectionMenuPos({ 
            top: Math.max(10, coords.top - 46), 
            left: Math.min(coords.left, window.innerWidth - 320) 
          });
          setShowSelectionMenu(true);
          return;
        }
      }
      setShowSelectionMenu(false);
    },
  });

  // Sync content when active document changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  // Close slash menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
      }
    };
    if (showSlashMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSlashMenu]);

  if (!editor) return null;

  const insertBlock = (type: 'h1' | 'h2' | 'h3' | 'bullet' | 'ordered' | 'code' | 'ai' | 'quote' | 'task' | 'toggle') => {
    setShowSlashMenu(false);
    // Remove the '/' trigger character
    const { from } = editor.state.selection;
    if (from > 0) {
      editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
    }

    switch (type) {
      case 'h1': editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
      case 'h2': editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
      case 'h3': editor.chain().focus().toggleHeading({ level: 3 }).run(); break;
      case 'bullet': editor.chain().focus().toggleBulletList().run(); break;
      case 'ordered': editor.chain().focus().toggleOrderedList().run(); break;
      case 'code': editor.chain().focus().toggleCodeBlock().run(); break;
      case 'quote': editor.chain().focus().toggleBlockquote().run(); break;
      case 'task': editor.chain().focus().toggleTaskList().run(); break;
      case 'toggle':
        // Insert a native <details> toggle block as HTML
        editor.chain().focus().insertContent(
          `<details open=""><summary>▶ Toggle — click to expand</summary><p>Add your content here...</p></details><p></p>`
        ).run();
        break;
      case 'ai': onAskAI(editor.getText()); break;
    }
  };

  const SLASH_MENU_ITEMS = [
    { type: 'ai' as const, icon: <Sparkles size={13} className="text-indigo-400" />, label: 'Ask AI to Generate...', color: 'text-indigo-300', hot: '✨' },
    { type: 'h1' as const, icon: <Heading1 size={13} className="text-zinc-500" />, label: 'Heading 1', hot: '#' },
    { type: 'h2' as const, icon: <Heading2 size={13} className="text-zinc-500" />, label: 'Heading 2', hot: '##' },
    { type: 'h3' as const, icon: <Heading3 size={13} className="text-zinc-500" />, label: 'Heading 3', hot: '###' },
    { type: 'toggle' as const, icon: <ChevronRight size={13} className="text-zinc-500" />, label: 'Toggle Block', hot: '▶' },
    { type: 'task' as const, icon: <CheckSquare size={13} className="text-zinc-500" />, label: 'Task / Checklist', hot: '[]' },
    { type: 'bullet' as const, icon: <List size={13} className="text-zinc-500" />, label: 'Bulleted List', hot: '-' },
    { type: 'ordered' as const, icon: <List size={13} className="text-zinc-500" />, label: 'Numbered List', hot: '1.' },
    { type: 'code' as const, icon: <Code size={13} className="text-zinc-500" />, label: 'Code Block', hot: '```' },
    { type: 'quote' as const, icon: <Quote size={13} className="text-zinc-500" />, label: 'Blockquote', hot: '>' },
  ];

  return (
    <div className="relative w-full">
      {/* ── Slash Command Menu ── */}
      {showSlashMenu && (
        <div 
          ref={menuRef}
          style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
          className="fixed z-50 w-72 bg-[#0e1017] border border-white/[0.08] rounded-xl shadow-2xl py-1.5 backdrop-blur-2xl animate-fade-in"
        >
          <div className="text-[9.5px] font-bold text-zinc-500 uppercase px-3 py-1 tracking-wider">
            Insert Block
          </div>
          {SLASH_MENU_ITEMS.map((item) => (
            <button 
              key={item.type}
              type="button"
              onClick={() => insertBlock(item.type)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition group
                ${item.type === 'ai' 
                  ? 'text-indigo-300 hover:bg-indigo-500/15 hover:text-white font-semibold' 
                  : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              <span className="text-[9px] font-mono text-zinc-600 bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.05]">{item.hot}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Floating AI Selection Toolbar ── */}
      {showSelectionMenu && (
        <div
          style={{ top: `${selectionMenuPos.top}px`, left: `${selectionMenuPos.left}px` }}
          className="fixed z-50 flex items-center gap-1 p-1 bg-[#0c0e14]/95 border border-white/[0.12] rounded-xl shadow-2xl backdrop-blur-2xl animate-fade-in"
        >
          <button
            type="button"
            onClick={() => {
              setShowSelectionMenu(false);
              onAskAI(`Rewrite this concisely: "${selectedText}"`);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 transition"
          >
            <Sparkles size={12} className="text-purple-400" />
            <span>Rewrite AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowSelectionMenu(false);
              onAskAI(`Summarize key points: "${selectedText}"`);
            }}
            className="px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
          >
            Summarize
          </button>

          <div className="w-[1px] h-4 bg-white/[0.1] mx-0.5" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition font-bold text-xs ${editor.isActive('bold') ? 'text-purple-400 bg-purple-500/20' : ''}`}
            title="Bold"
          >
            B
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition italic text-xs ${editor.isActive('italic') ? 'text-purple-400 bg-purple-500/20' : ''}`}
            title="Italic"
          >
            I
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition text-xs font-mono ${editor.isActive('code') ? 'text-purple-400 bg-purple-500/20' : ''}`}
            title="Inline Code"
          >
            &lt;/&gt;
          </button>
        </div>
      )}

      {/* ── Tiptap Block Canvas ── */}
      <style>{`
        /* Notion-style toggle block */
        .tiptap-editor-root details {
          margin: 6px 0;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          overflow: hidden;
        }
        .tiptap-editor-root details summary {
          padding: 7px 12px;
          cursor: pointer;
          font-size: 13.5px;
          color: #d1d5db;
          list-style: none;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }
        .tiptap-editor-root details summary::-webkit-details-marker { display: none; }
        .tiptap-editor-root details summary::before {
          content: '▶';
          font-size: 9px;
          color: #6366f1;
          transition: transform 0.15s;
          flex-shrink: 0;
        }
        .tiptap-editor-root details[open] summary::before {
          transform: rotate(90deg);
        }
        .tiptap-editor-root details > *:not(summary) {
          padding: 8px 12px 8px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        /* Task list checkboxes */
        .tiptap-editor-root ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .tiptap-editor-root ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 2px 0;
        }
        .tiptap-editor-root ul[data-type="taskList"] li > label {
          margin-top: 2px;
          flex-shrink: 0;
        }
        .tiptap-editor-root ul[data-type="taskList"] li > label input[type="checkbox"] {
          width: 14px;
          height: 14px;
          accent-color: #6366f1;
          cursor: pointer;
          border-radius: 3px;
        }
        .tiptap-editor-root ul[data-type="taskList"] li[data-checked="true"] > div {
          text-decoration: line-through;
          opacity: 0.5;
        }
        /* Headings */
        .tiptap-editor-root h1 { font-size: 2em; font-weight: 700; margin: 16px 0 8px; color: #f3f4f6; letter-spacing: -0.025em; }
        .tiptap-editor-root h2 { font-size: 1.45em; font-weight: 600; margin: 14px 0 6px; color: #f3f4f6; letter-spacing: -0.015em; }
        .tiptap-editor-root h3 { font-size: 1.15em; font-weight: 600; margin: 12px 0 4px; color: #e5e7eb; }
        .tiptap-editor-root p { margin: 4px 0; color: #d1d5db; }
        .tiptap-editor-root code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 0.85em; font-family: 'JetBrains Mono', 'Fira Code', monospace; color: #a5b4fc; }
        .tiptap-editor-root a { color: #6366f1; text-decoration: underline; }
      `}</style>
      <div className="tiptap-editor-root">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default BlockEditor;
