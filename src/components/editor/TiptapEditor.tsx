import React, { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import SlashCommandExtension from './SlashCommandExtension';
import { SlashCommandMenu, type SlashCommandMenuRef } from './SlashCommandMenu';
import { AiSelectionBubbleMenu } from './AiSelectionBubbleMenu';
import { Sparkles, Send } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TiptapEditorProps {
  initialContent?: any;
  onContentChange: (content: any) => void;
  documentTitle?: string;
  onOpenAIModal?: () => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  initialContent,
  onContentChange,
  documentTitle = 'Untitled Page',
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const menuComponentRef = useRef<SlashCommandMenuRef | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [menuState, setMenuState] = useState<{
    isOpen: boolean;
    items: any[];
    command: any;
    coords: { x: number; y: number } | null;
  }>({
    isOpen: false,
    items: [],
    command: null,
    coords: null,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'rounded-xl bg-zinc-900 border border-zinc-800 p-4 font-mono text-xs text-zinc-200 overflow-x-auto my-3',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-outside pl-6 space-y-1 text-zinc-300 text-sm my-2',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-outside pl-6 space-y-1 text-zinc-300 text-sm my-2',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-2 border-purple-500 pl-4 py-1 italic text-zinc-400 my-3 bg-purple-950/10 rounded-r-lg',
          },
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'space-y-1.5 my-2 not-prose',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2 text-sm text-zinc-300',
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands or press Space for AI...",
        emptyEditorClass: 'is-editor-empty',
      }),
      SlashCommandExtension.configure({
        suggestion: {
          render: () => {
            return {
              onStart: (props: any) => {
                const rect = props.clientRect?.();
                if (rect) {
                  setMenuState({
                    isOpen: true,
                    items: props.items,
                    command: props.command,
                    coords: { x: rect.left, y: rect.bottom + 6 },
                  });
                }
              },
              onUpdate: (props: any) => {
                const rect = props.clientRect?.();
                setMenuState((prev) => ({
                  ...prev,
                  items: props.items,
                  command: props.command,
                  coords: rect ? { x: rect.left, y: rect.bottom + 6 } : prev.coords,
                }));
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  setMenuState((prev) => ({ ...prev, isOpen: false }));
                  return true;
                }
                return menuComponentRef.current?.onKeyDown?.(props) || false;
              },
              onExit: () => {
                setMenuState((prev) => ({ ...prev, isOpen: false }));
              },
            };
          },
        },
      }),
    ],
    content: initialContent && Object.keys(initialContent).length > 0
      ? initialContent
      : `
        <h2>Overview & Architecture</h2>
        <p>CogniSpace is your AI-enhanced second brain, built with zero-latency optimistic state updates, debounced 800ms autosaving, and a rich block-style editor.</p>
        <ul data-type="taskList">
          <li data-type="taskItem" data-checked="true">Implement Zinc-950 dark mode tokens with glowing Indigo-Purple-Pink badge</li>
          <li data-type="taskItem" data-checked="true">Construct 3-level deep hierarchical folder/page tree</li>
          <li data-type="taskItem" data-checked="true">Add Tiptap rich-text editor with floating '/' Slash Command menu</li>
          <li data-type="taskItem" data-checked="true">Support floating inline AI rewriting toolbar on text selection</li>
          <li data-type="taskItem" data-checked="false">Connect real-time CRDT multi-user awareness</li>
        </ul>
        <pre><code class="language-typescript">// CogniSpace Synchronized State
interface DocumentUpdate {
  title: string;
  content: Record&lt;string, any&gt;;
  updatedAt: string;
}</code></pre>
      `,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px] text-zinc-200 text-sm leading-relaxed prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:my-2 prose-pre:my-3',
      },
    },
    onUpdate: ({ editor }) => {
      // Optimistic update: trigger local content change immediately
      const json = editor.getJSON();
      onContentChange(json);
    },
  });

  // Handle AI Prompt insertion
  const handleGenerateAI = (customPrompt?: string) => {
    const text = customPrompt || aiPrompt;
    if (!text.trim() || !editor) return;

    setIsGeneratingAI(true);
    setAiPrompt('');

    setTimeout(() => {
      editor
        .chain()
        .focus()
        .insertContent(`
          <blockquote class="border-l-2 border-purple-500 pl-4 py-2 italic text-purple-200 my-3 bg-purple-950/20 rounded-r-xl">
            <strong>✨ CogniSpace AI (${text}):</strong> Generated refined architecture notes matching Zinc-950 tokens, compound indexes on [workspaceId, parentId], and single-query hierarchical tree aggregation.
          </blockquote>
          <p></p>
        `)
        .run();
      setIsGeneratingAI(false);
    }, 700);
  };

  return (
    <div className="relative max-w-4xl mx-auto px-6 sm:px-12 py-4">
      {/* Floating Selection AI Bubble Menu */}
      {editor && (
        <AiSelectionBubbleMenu
          editor={editor}
          documentTitle={documentTitle}
        />
      )}

      {/* Inline AI Copilot Generation Bar */}
      <div className="mb-6 p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 shadow-xl glow-ai">
        <div className="flex items-center gap-2.5">
          <Sparkles className={cn("w-4 h-4 text-purple-400 flex-shrink-0", isGeneratingAI && "animate-spin")} />
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
            placeholder={`Ask CogniSpace AI to draft, summarize, or edit "${documentTitle}"...`}
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            onClick={() => handleGenerateAI()}
            disabled={!aiPrompt.trim() || isGeneratingAI}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>{isGeneratingAI ? 'Writing...' : 'Generate'}</span>
            <Send className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex-shrink-0">
            Quick Prompts:
          </span>
          {[
            'Summarize key points',
            'Generate test checklist',
            'Write TypeScript interfaces',
            'Draft meeting notes',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleGenerateAI(prompt)}
              className="text-[11px] text-zinc-400 hover:text-purple-300 bg-zinc-950/60 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-800/60 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tiptap Prose Canvas */}
      <div className="min-h-[400px] cursor-text">
        <EditorContent editor={editor} />
      </div>

      {/* Floating Slash Command Popover Menu */}
      {menuState.isOpen && menuState.coords && (
        <div
          ref={popupRef}
          className="fixed z-50 animate-slide-down"
          style={{
            left: `${menuState.coords.x}px`,
            top: `${menuState.coords.y}px`,
          }}
        >
          <SlashCommandMenu
            ref={menuComponentRef}
            items={menuState.items}
            command={(item) => {
              if (menuState.command) {
                menuState.command(item);
              }
              setMenuState((prev) => ({ ...prev, isOpen: false }));
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TiptapEditor;
