import React, { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Scissors, 
  CheckCheck, 
  Send, 
  Check, 
  CornerDownRight, 
  X,
  Loader2
} from 'lucide-react';
import { streamAiTransform } from '../../services/aiStreamService';
import { cn } from '../../lib/utils';

interface AiSelectionBubbleMenuProps {
  editor: Editor;
  documentTitle?: string;
}

export const AiSelectionBubbleMenu: React.FC<AiSelectionBubbleMenuProps> = ({
  editor,
  documentTitle = 'Workspace Document',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAiMode, setIsAiMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position calculation based on editor selection
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      if (from === to || editor.isActive('image')) {
        if (!isAiMode) {
          setIsVisible(false);
        }
        return;
      }

      const startCoord = editor.view.coordsAtPos(from);
      const endCoord = editor.view.coordsAtPos(to);

      const midX = (startCoord.left + endCoord.right) / 2;
      const topY = Math.min(startCoord.top, endCoord.top) - 10;

      setCoords({
        x: Math.max(20, midX),
        y: Math.max(60, topY),
      });
      setIsVisible(true);
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('blur', () => {
      setTimeout(() => {
        if (!document.activeElement || !menuRef.current?.contains(document.activeElement)) {
          if (!isAiMode) setIsVisible(false);
        }
      }, 200);
    });

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, isAiMode]);

  const getSelectedText = (): string => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  };

  const handleAction = (promptText: string, actionLabel: string) => {
    const selected = getSelectedText();
    if (!selected.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsAiMode(true);
    setIsStreaming(true);
    setActiveAction(actionLabel);
    setStreamedText('');

    streamAiTransform({
      prompt: promptText,
      selectedText: selected,
      contextTitle: documentTitle,
      signal: abortControllerRef.current.signal,
      onChunk: (accumulated) => {
        setStreamedText(accumulated);
      },
      onDone: (finalText) => {
        setStreamedText(finalText);
        setIsStreaming(false);
      },
      onError: (err) => {
        console.error('Streaming error:', err);
        setIsStreaming(false);
      },
    });
  };

  const handleApplyReplace = () => {
    if (!streamedText) return;
    const { from, to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(streamedText)
      .run();
    handleClose();
  };

  const handleApplyInsertBelow = () => {
    if (!streamedText) return;
    const { to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .setTextSelection(to)
      .insertContent(`\n<p>${streamedText}</p>`)
      .run();
    handleClose();
  };

  const handleClose = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAiMode(false);
    setIsStreaming(false);
    setStreamedText('');
    setCustomPrompt('');
    setActiveAction(null);
    setIsVisible(false);
  };

  if (!isVisible && !isAiMode) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 animate-slide-down shadow-2xl"
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* State 1: Action Selector Toolbar */}
        {!isAiMode ? (
          <div className="flex items-center p-1 gap-0.5 text-xs text-zinc-300">
            {/* AI Pill Header */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-pink-950/80 text-purple-200 rounded-lg font-semibold border border-purple-800/40 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                CogniSpace AI
              </span>
            </div>

            {/* Quick Action: Rewrite */}
            <button
              type="button"
              onClick={() => handleAction('Rewrite and improve clarity', 'Rewrite')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-zinc-400" />
              <span>Rewrite</span>
            </button>

            {/* Quick Action: Summarize */}
            <button
              type="button"
              onClick={() => handleAction('Summarize concisely', 'Summarize')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <FileText className="w-3 h-3 text-zinc-400" />
              <span>Summarize</span>
            </button>

            {/* Quick Action: Make Shorter */}
            <button
              type="button"
              onClick={() => handleAction('Make shorter and more direct', 'Make Shorter')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <Scissors className="w-3 h-3 text-zinc-400" />
              <span>Make Shorter</span>
            </button>

            {/* Quick Action: Fix Grammar */}
            <button
              type="button"
              onClick={() => handleAction('Fix all grammar and typos', 'Fix Grammar')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
            >
              <CheckCheck className="w-3 h-3 text-zinc-400" />
              <span>Fix Grammar</span>
            </button>

            {/* Custom Prompt Toggle */}
            <div className="h-4 border-r border-zinc-800 mx-1" />

            <div className="flex items-center gap-1">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim()) {
                    handleAction(customPrompt, customPrompt);
                  }
                }}
                placeholder="Custom prompt..."
                className="w-32 bg-zinc-950 border border-zinc-800 text-zinc-100 px-2 py-0.5 rounded text-xs focus:outline-none focus:border-purple-500 placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => {
                  if (customPrompt.trim()) {
                    handleAction(customPrompt, customPrompt);
                  }
                }}
                disabled={!customPrompt.trim()}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Live Streaming Response Preview */
          <div className="w-80 sm:w-96 p-3 space-y-3">
            {/* Header info bar */}
            <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles className={cn("w-3.5 h-3.5 text-purple-400", isStreaming && "animate-spin")} />
                <span className="font-semibold text-zinc-200">{activeAction}</span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Streamed Output Box */}
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-200 max-h-48 overflow-y-auto leading-relaxed">
              {streamedText ? (
                <span>
                  {streamedText}
                  {isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-purple-400 animate-pulse" />}
                </span>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  <span>Generating AI rewrite...</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Replace, Insert Below, Try Again */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleAction(activeAction || 'Rewrite', activeAction || 'Rewrite')}
                disabled={isStreaming}
                className="text-[11px] text-zinc-400 hover:text-zinc-200 disabled:opacity-40 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Try Again</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleApplyInsertBelow}
                  disabled={isStreaming || !streamedText}
                  className="px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>Insert Below</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyReplace}
                  disabled={isStreaming || !streamedText}
                  className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 rounded-lg transition-all flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  <span>Replace Selection</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSelectionBubbleMenu;
