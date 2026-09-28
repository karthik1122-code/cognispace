import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckSquare, 
  Square, 
  Copy, 
  Check, 
  Plus, 
  Heading2, 
  Type, 
  ListTodo, 
  Terminal, 
  AlertCircle, 
  Send, 
  ArrowUpRight
} from 'lucide-react';
import type { EditorBlock } from '../../types/workspace';
import { cn } from '../../lib/utils';

interface EditorCanvasProps {
  blocks?: EditorBlock[];
  onOpenAIModal?: () => void;
}

const DEFAULT_BLOCKS: EditorBlock[] = [
  {
    id: 'b-ai-1',
    type: 'callout',
    calloutType: 'ai',
    content: '✨ CogniSpace AI Synthesis: Synthesizing architecture notes with dark mode primary theme (Zinc-950/Zinc-900), glowing Indigo-to-Pink gradient accents, and Inter typography tokens.',
  },
  {
    id: 'b-h2-1',
    type: 'heading-2',
    content: 'Overview & Design Principles',
  },
  {
    id: 'b-p-1',
    type: 'paragraph',
    content: 'CogniSpace merges the flexible recursive hierarchical workspace of Notion with the high-performance keyboard-first ergonomics of Linear. Designed for deep engineering workflows.',
  },
  {
    id: 'b-check-1',
    type: 'checklist',
    content: 'Dark mode tokens: background `zinc-950`, cards `zinc-900`, borders `zinc-800/80`',
    checked: true,
  },
  {
    id: 'b-check-2',
    type: 'checklist',
    content: 'Inter font typography with high-density layout and subtle micro-animations',
    checked: true,
  },
  {
    id: 'b-check-3',
    type: 'checklist',
    content: 'Collapsible sidebar with workspace switcher, quick actions, and 3-level tree hierarchy',
    checked: true,
  },
  {
    id: 'b-check-4',
    type: 'checklist',
    content: 'Interactive breadcrumbs, inline editable H1 title, and block editor canvas',
    checked: false,
  },
  {
    id: 'b-code-1',
    type: 'code',
    language: 'typescript',
    content: `interface CogniSpaceTheme {
  primaryBg: 'bg-zinc-950'; // #09090b
  surfaceBg: 'bg-zinc-900'; // #18181b
  subtleBorder: 'border-zinc-800/80';
  accentGradient: 'from-indigo-500 via-purple-500 to-pink-500';
  textPrimary: 'text-zinc-100';
  textMuted: 'text-zinc-400';
}`,
  },
  {
    id: 'b-linear-1',
    type: 'linear-issue',
    content: 'Synced Linear issue ticket',
    issueDetails: {
      identifier: 'COG-108',
      title: 'Implement real-time collaborative CRDT tree sync',
      priority: 'high',
      status: 'In Progress',
    },
  },
];

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  blocks: initialBlocks,
}) => {
  const [blocks, setBlocks] = useState<EditorBlock[]>(initialBlocks && initialBlocks.length > 0 ? initialBlocks : DEFAULT_BLOCKS);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeNewBlockText, setActiveNewBlockText] = useState('');

  const toggleChecklist = (id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, checked: !b.checked } : b));
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  const handleAddBlock = (type: EditorBlock['type']) => {
    let newBlock: EditorBlock;
    if (type === 'heading-2') {
      newBlock = { id: `b-${Date.now()}`, type: 'heading-2', content: 'New Section Heading' };
    } else if (type === 'checklist') {
      newBlock = { id: `b-${Date.now()}`, type: 'checklist', content: 'New action item', checked: false };
    } else if (type === 'code') {
      newBlock = { id: `b-${Date.now()}`, type: 'code', language: 'typescript', content: '// Write typescript code here\nconst ready = true;' };
    } else if (type === 'callout') {
      newBlock = { id: `b-${Date.now()}`, type: 'callout', calloutType: 'info', content: 'Important note for the team.' };
    } else {
      newBlock = { id: `b-${Date.now()}`, type: 'paragraph', content: 'Start typing here...' };
    }
    setBlocks(prev => [...prev, newBlock]);
    setSlashMenuOpen(false);
  };

  const handleSendAiPrompt = (promptText?: string) => {
    const textToSend = promptText || aiPromptInput;
    if (!textToSend.trim()) return;

    setIsAiGenerating(true);
    setAiPromptInput('');

    setTimeout(() => {
      const generatedBlock: EditorBlock = {
        id: `b-ai-${Date.now()}`,
        type: 'callout',
        calloutType: 'ai',
        content: `✨ CogniSpace AI Output for "${textToSend}": Generated optimized implementation plan and design recommendations with strict 1px border constraints and sub-component breakdown.`,
      };
      setBlocks(prev => [generatedBlock, ...prev]);
      setIsAiGenerating(false);
    }, 900);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-12 py-6 space-y-6">
      {/* AI Assistant Quick Input Bar */}
      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/90 shadow-xl glow-ai">
        <div className="flex items-center gap-2">
          <Sparkles className={cn("w-4 h-4 text-purple-400 flex-shrink-0", isAiGenerating && "animate-spin")} />
          <input
            type="text"
            value={aiPromptInput}
            onChange={(e) => setAiPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendAiPrompt()}
            placeholder="Ask CogniSpace AI Copilot to draft, summarize, generate code, or outline..."
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          <button
            onClick={() => handleSendAiPrompt()}
            disabled={!aiPromptInput.trim() || isAiGenerating}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 rounded-lg transition-all flex items-center gap-1 shadow-sm"
          >
            <span>{isAiGenerating ? 'Thinking...' : 'Generate'}</span>
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* AI Prompt Chips */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/60 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex-shrink-0">
            Suggested:
          </span>
          {[
            'Summarize architecture',
            'Generate test plan',
            'Extract action items',
            'Convert to Linear tickets',
          ].map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSendAiPrompt(prompt)}
              className="text-[11px] text-zinc-400 hover:text-purple-300 bg-zinc-950/60 hover:bg-purple-950/40 border border-zinc-800 hover:border-purple-800/60 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Rendered Block List */}
      <div className="space-y-4">
        {blocks.map((block) => {
          switch (block.type) {
            case 'heading-1':
              return (
                <h2 key={block.id} className="text-2xl font-bold tracking-tight text-zinc-100 pt-4">
                  {block.content}
                </h2>
              );

            case 'heading-2':
              return (
                <h3 key={block.id} className="text-lg font-semibold tracking-tight text-zinc-200 pt-3 border-b border-zinc-850 pb-1">
                  {block.content}
                </h3>
              );

            case 'checklist':
              return (
                <div 
                  key={block.id} 
                  className="flex items-start gap-2.5 text-sm text-zinc-300 group cursor-pointer"
                  onClick={() => toggleChecklist(block.id)}
                >
                  <button type="button" className="mt-0.5 text-zinc-400 hover:text-zinc-200">
                    {block.checked ? (
                      <CheckSquare className="w-4 h-4 text-purple-400 fill-purple-500/20" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200" />
                    )}
                  </button>
                  <span className={cn("flex-1 text-xs sm:text-sm leading-relaxed", block.checked && "line-through text-zinc-400")}>
                    {block.content}
                  </span>
                </div>
              );

            case 'callout':
              return (
                <div 
                  key={block.id} 
                  className={cn(
                    "p-3.5 rounded-xl border flex items-start gap-3 text-xs sm:text-sm leading-relaxed",
                    block.calloutType === 'ai' 
                      ? "bg-purple-950/20 border-purple-900/40 text-purple-200" 
                      : "bg-zinc-900 border-zinc-800 text-zinc-300"
                  )}
                >
                  {block.calloutType === 'ai' ? (
                    <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p>{block.content}</p>
                  </div>
                </div>
              );

            case 'code':
              return (
                <div key={block.id} className="relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden group">
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-950 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span>{block.language || 'typescript'}</span>
                    <button
                      onClick={() => handleCopyCode(block.id, block.content)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      {copiedBlockId === block.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed">
                    <code>{block.content}</code>
                  </pre>
                </div>
              );

            case 'linear-issue':
              return (
                <div key={block.id} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-purple-300">
                      {block.issueDetails?.identifier.split('-')[0] || 'COG'}
                    </div>
                    <span className="text-xs font-mono font-semibold text-zinc-300">
                      {block.issueDetails?.identifier}
                    </span>
                    <span className="text-xs text-zinc-200 truncate">
                      {block.issueDetails?.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      {block.issueDetails?.status}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                </div>
              );

            case 'paragraph':
            default:
              return (
                <p key={block.id} className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {block.content}
                </p>
              );
          }
        })}
      </div>

      {/* Interactive New Block Placeholder & Slash Command Trigger */}
      <div className="relative pt-2">
        <div className="flex items-center gap-2 group">
          <button
            type="button"
            onClick={() => setSlashMenuOpen(!slashMenuOpen)}
            title="Add a block or type '/'"
            className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <input
            type="text"
            value={activeNewBlockText}
            onChange={(e) => {
              const val = e.target.value;
              setActiveNewBlockText(val);
              if (val.startsWith('/')) {
                setSlashMenuOpen(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && activeNewBlockText.trim()) {
                setBlocks(prev => [...prev, { id: `b-${Date.now()}`, type: 'paragraph', content: activeNewBlockText }]);
                setActiveNewBlockText('');
              }
            }}
            placeholder="Type '/' for commands or 'Space' for CogniSpace AI..."
            className="w-full bg-transparent text-xs text-zinc-400 placeholder:text-zinc-600 focus:text-zinc-200 focus:outline-none"
          />
        </div>

        {/* Slash Command Popover Menu */}
        {slashMenuOpen && (
          <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-1.5 backdrop-blur-xl animate-slide-down">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-2 py-1">
              Insert Block
            </div>

            <div className="space-y-0.5">
              <button
                onClick={() => handleAddBlock('paragraph')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <Type className="w-3.5 h-3.5 text-zinc-400" />
                <div className="text-left">
                  <div className="font-medium">Text</div>
                  <div className="text-[10px] text-zinc-400">Plain text block</div>
                </div>
              </button>

              <button
                onClick={() => handleAddBlock('heading-2')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <Heading2 className="w-3.5 h-3.5 text-zinc-400" />
                <div className="text-left">
                  <div className="font-medium">Heading</div>
                  <div className="text-[10px] text-zinc-400">Medium section heading</div>
                </div>
              </button>

              <button
                onClick={() => handleAddBlock('checklist')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <ListTodo className="w-3.5 h-3.5 text-zinc-400" />
                <div className="text-left">
                  <div className="font-medium">To-do List</div>
                  <div className="text-[10px] text-zinc-400">Track tasks with checkbox</div>
                </div>
              </button>

              <button
                onClick={() => handleAddBlock('code')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                <div className="text-left">
                  <div className="font-medium">Code Block</div>
                  <div className="text-[10px] text-zinc-400">Syntax highlighted code</div>
                </div>
              </button>

              <button
                onClick={() => handleAddBlock('callout')}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <div className="text-left">
                  <div className="font-medium">AI Callout</div>
                  <div className="text-[10px] text-zinc-400">Highlighted insights or warnings</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
