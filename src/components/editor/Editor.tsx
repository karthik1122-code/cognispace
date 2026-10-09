import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, type Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, Code2, Quote, Minus, ChevronRight, Sparkles, Bold, Italic, Code, Strikethrough,
} from 'lucide-react';
import { cn } from '../../lib/cn';

interface EditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  onAskAI: (prompt: string) => void;
}

interface SlashItem {
  key: string;
  label: string;
  hint: string;
  keywords: string;
  icon: React.ReactNode;
  run: (editor: TiptapEditor, askAI: (p: string) => void) => void;
}

const ITEMS: SlashItem[] = [
  { key: 'ai', label: 'Ask AI', hint: 'Generate or edit with Copilot', keywords: 'ai gpt gemini write copilot', icon: <Sparkles size={15} className="text-accent" />, run: (_e, ask) => ask('') },
  { key: 'h1', label: 'Heading 1', hint: 'Big section title', keywords: 'h1 title heading', icon: <Heading1 size={15} />, run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { key: 'h2', label: 'Heading 2', hint: 'Medium section title', keywords: 'h2 heading', icon: <Heading2 size={15} />, run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { key: 'h3', label: 'Heading 3', hint: 'Small section title', keywords: 'h3 heading', icon: <Heading3 size={15} />, run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { key: 'task', label: 'To-do list', hint: 'Track tasks with checkboxes', keywords: 'todo task check', icon: <ListChecks size={15} />, run: (e) => e.chain().focus().toggleTaskList().run() },
  { key: 'bullet', label: 'Bulleted list', hint: 'A simple list', keywords: 'bullet list ul', icon: <List size={15} />, run: (e) => e.chain().focus().toggleBulletList().run() },
  { key: 'ordered', label: 'Numbered list', hint: 'An ordered list', keywords: 'number ordered ol', icon: <ListOrdered size={15} />, run: (e) => e.chain().focus().toggleOrderedList().run() },
  { key: 'toggle', label: 'Toggle', hint: 'Collapsible section', keywords: 'toggle details collapse', icon: <ChevronRight size={15} />, run: (e) => e.chain().focus().insertContent('<details open><summary>Toggle title</summary><p>Hidden content…</p></details><p></p>').run() },
  { key: 'quote', label: 'Quote', hint: 'Highlight a passage', keywords: 'quote blockquote', icon: <Quote size={15} />, run: (e) => e.chain().focus().toggleBlockquote().run() },
  { key: 'code', label: 'Code block', hint: 'Monospaced snippet', keywords: 'code pre snippet', icon: <Code2 size={15} />, run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { key: 'hr', label: 'Divider', hint: 'Separate sections', keywords: 'divider hr line', icon: <Minus size={15} />, run: (e) => e.chain().focus().setHorizontalRule().run() },
];

export function Editor({ initialContent, onChange, onAskAI }: EditorProps) {
  const [slash, setSlash] = useState<{ from: number; query: string; top: number; left: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [sel, setSel] = useState<{ top: number; left: number; text: string } | null>(null);

  // Handlers read the latest state through refs so TipTap's one-time config never goes stale.
  const slashRef = useRef(slash);
  const indexRef = useRef(index);
  const matchesRef = useRef<SlashItem[]>(ITEMS);
  const askRef = useRef(onAskAI);
  const changeRef = useRef(onChange);
  slashRef.current = slash;
  indexRef.current = index;
  askRef.current = onAskAI;
  changeRef.current = onChange;

  const matches = useMemo(() => {
    const q = slash?.query.toLowerCase().trim() ?? '';
    return q ? ITEMS.filter((i) => `${i.label} ${i.keywords}`.toLowerCase().includes(q)) : ITEMS;
  }, [slash?.query]);
  matchesRef.current = matches;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Write, or press '/' for commands" }),
    ],
    content: initialContent || '<p></p>',
    editorProps: {
      attributes: { class: 'doc-editor', spellcheck: 'true' },
      handleKeyDown: (view, event) => {
        const open = slashRef.current;
        if (open) {
          const list = matchesRef.current;
          if (event.key === 'ArrowDown') { event.preventDefault(); setIndex((i) => (i + 1) % Math.max(1, list.length)); return true; }
          if (event.key === 'ArrowUp') { event.preventDefault(); setIndex((i) => (i - 1 + list.length) % Math.max(1, list.length)); return true; }
          if (event.key === 'Enter' || event.key === 'Tab') {
            const item = list[indexRef.current];
            if (item) { event.preventDefault(); runItem(item); return true; }
          }
          if (event.key === 'Escape') { setSlash(null); return true; }
        }
        if (event.key === '/' && !open) {
          const { from, empty } = view.state.selection;
          const $from = view.state.selection.$from;
          const atLineStart = $from.parentOffset === 0 || $from.parent.textContent.slice(0, $from.parentOffset).trim() === '';
          if (empty && atLineStart) {
            // open after the "/" is inserted
            setTimeout(() => {
              const c = view.coordsAtPos(from);
              setIndex(0);
              setSlash({ from, query: '', top: c.bottom + 6, left: Math.min(c.left, window.innerWidth - 300) });
            }, 0);
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      changeRef.current(ed.getHTML());
      const open = slashRef.current;
      if (open) {
        const head = ed.state.selection.head;
        const text = head > open.from ? ed.state.doc.textBetween(open.from, head, '\n') : '';
        if (!text.startsWith('/') || /\s/.test(text) || head <= open.from) setSlash(null);
        else { setSlash({ ...open, query: text.slice(1) }); setIndex(0); }
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to, empty } = ed.state.selection;
      if (empty) { setSel(null); return; }
      const text = ed.state.doc.textBetween(from, to, ' ');
      if (!text.trim()) { setSel(null); return; }
      const c = ed.view.coordsAtPos(from);
      setSel({ top: Math.max(8, c.top - 48), left: Math.min(Math.max(8, c.left - 20), window.innerWidth - 340), text });
    },
  });

  function runItem(item: SlashItem) {
    const ed = editor;
    const open = slashRef.current;
    if (!ed || !open) return;
    ed.chain().focus().deleteRange({ from: open.from, to: ed.state.selection.head }).run();
    setSlash(null);
    item.run(ed, (p) => askRef.current(p));
  }

  // Close menus on outside click
  useEffect(() => {
    if (!slash) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-slash-menu]')) setSlash(null); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [slash]);

  if (!editor) return null;

  return (
    <div className="relative">
      <EditorContent editor={editor} />

      {slash && (
        <div
          data-slash-menu
          role="listbox"
          aria-label="Insert block"
          style={{ top: slash.top, left: slash.left }}
          className="fixed z-50 max-h-[320px] w-[280px] animate-pop-in overflow-y-auto rounded-xl border border-line-strong bg-elevated p-1.5 shadow-pop"
        >
          {matches.length === 0 && <div className="px-3 py-6 text-center text-[13px] text-faint">No blocks match “{slash.query}”</div>}
          {matches.map((item, i) => (
            <button
              key={item.key}
              role="option"
              aria-selected={i === index}
              onMouseEnter={() => setIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); runItem(item); }}
              className={cn('flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left', i === index ? 'bg-accent/12 text-fg' : 'text-muted')}
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-line bg-fg/[0.03]">{item.icon}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-fg">{item.label}</span>
                <span className="block truncate text-[11.5px] text-faint">{item.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {sel && (
        <div
          style={{ top: sel.top, left: sel.left }}
          className="fixed z-50 flex animate-pop-in items-center gap-0.5 rounded-xl border border-line-strong bg-elevated p-1 shadow-pop"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            className="flex h-7 items-center gap-1.5 rounded-lg bg-accent/15 px-2.5 text-[12px] font-semibold text-accent hover:bg-accent/25"
            onClick={() => { onAskAI(`Improve the writing of this text:\n\n${sel.text}`); setSel(null); }}
          >
            <Sparkles size={13} /> Improve
          </button>
          <button className="h-7 rounded-lg px-2 text-[12px] text-muted hover:bg-fg/[0.07] hover:text-fg" onClick={() => { onAskAI(`Summarize this into bullet points:\n\n${sel.text}`); setSel(null); }}>Summarize</button>
          <span className="mx-1 h-4 w-px bg-line-strong" />
          <FmtButton active={editor.isActive('bold')} label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></FmtButton>
          <FmtButton active={editor.isActive('italic')} label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></FmtButton>
          <FmtButton active={editor.isActive('strike')} label="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></FmtButton>
          <FmtButton active={editor.isActive('code')} label="Inline code" onClick={() => editor.chain().focus().toggleCode().run()}><Code size={14} /></FmtButton>
        </div>
      )}
    </div>
  );
}

function FmtButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn('grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-fg/[0.07] hover:text-fg', active && 'bg-accent/15 text-accent')}
    >
      {children}
    </button>
  );
}
