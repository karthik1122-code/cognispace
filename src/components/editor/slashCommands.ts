import type { Editor } from '@tiptap/react';

export interface SlashCommandItem {
  title: string;
  description: string;
  searchTerms: string[];
  icon: string;
  command: (params: { editor: Editor; range: any }) => void;
}

export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large page section title',
    searchTerms: ['h1', 'heading', 'title', 'large'],
    icon: 'H1',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium sub-section heading',
    searchTerms: ['h2', 'heading', 'subtitle', 'medium'],
    icon: 'H2',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    searchTerms: ['h3', 'heading', 'small'],
    icon: 'H3',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bulleted list',
    searchTerms: ['bullet', 'list', 'unordered', 'point'],
    icon: '•',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleBulletList()
        .run();
    },
  },
  {
    title: 'Task List',
    description: 'Track tasks with interactive checkboxes',
    searchTerms: ['task', 'todo', 'checklist', 'checkbox'],
    icon: '☑',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleTaskList()
        .run();
    },
  },
  {
    title: 'Code Block',
    description: 'Syntax highlighted code snippet',
    searchTerms: ['code', 'snippet', 'pre', 'typescript', 'javascript'],
    icon: '</>',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleCodeBlock()
        .run();
    },
  },
  {
    title: 'AI Prompt Block',
    description: 'Ask CogniSpace AI to generate or summarize content',
    searchTerms: ['ai', 'copilot', 'sparkle', 'generate', 'prompt', 'assistant', 'cognispace'],
    icon: '✨',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '✨ [CogniSpace AI Assistant: Drafting architecture recommendations based on Zinc-950 design tokens and 3-level tree hierarchy...]',
            },
          ],
        })
        .run();
    },
  },
];
