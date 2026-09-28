import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';
import { SLASH_COMMAND_ITEMS, type SlashCommandItem } from './slashCommands';

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range });
        },
        items: ({ query }: { query: string }): SlashCommandItem[] => {
          if (!query) {
            return SLASH_COMMAND_ITEMS;
          }
          const cleanQuery = query.toLowerCase().trim();
          return SLASH_COMMAND_ITEMS.filter((item) => {
            return (
              item.title.toLowerCase().includes(cleanQuery) ||
              item.description.toLowerCase().includes(cleanQuery) ||
              item.searchTerms.some((term) => term.includes(cleanQuery))
            );
          });
        },
      } as Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommandExtension;
