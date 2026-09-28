import { Node } from '@tiptap/core';

/**
 * ToggleBlock Extension — Notion-style collapsible toggle.
 * Renders as an HTML <details> / <summary> pair.
 */
export const ToggleBlock = Node.create({
  name: 'toggleBlock',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: (el) => el.hasAttribute('open'),
        renderHTML: (attrs) => (attrs.open ? { open: '' } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['details', HTMLAttributes, ['summary', {}, 0]];
  },

  addCommands() {
    return {
      setToggleBlock:
        () =>
        ({ commands }: { commands: { setNode: (name: string) => boolean } }) => {
          return commands.setNode(this.name);
        },
    } as any;
  },
});

export default ToggleBlock;
