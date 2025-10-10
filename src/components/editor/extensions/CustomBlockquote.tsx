import Blockquote from '@tiptap/extension-blockquote';
import type { ChainedCommands } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customBlockquote: {
      setBlockquoteStyle: (className: string) => ReturnType;
      setBlockquoteAlign: (align: string) => ReturnType;
      setBlockquoteWidth: (width: string) => ReturnType;
    };
  }
}

export const CustomBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: 'quote-style-1',
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) {
            return {};
          }
          return {
            class: attributes.class,
          };
        },
      },
      'data-align': {
        default: 'center',
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: attributes => {
          return {
            'data-align': attributes['data-align'] || 'center',
          };
        },
      },
      'data-width': {
        default: '30%',
        parseHTML: element => element.getAttribute('data-width'),
        renderHTML: attributes => {
          return {
            'data-width': attributes['data-width'] || '30%',
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setBlockquoteStyle: (className: string) => ({ commands }: { commands: ChainedCommands }) => {
        return commands.updateAttributes('blockquote', { class: className });
      },
      setBlockquoteAlign: (align: string) => ({ commands }: { commands: ChainedCommands }) => {
        return commands.updateAttributes('blockquote', { 'data-align': align });
      },
      setBlockquoteWidth: (width: string) => ({ commands }: { commands: ChainedCommands }) => {
        return commands.updateAttributes('blockquote', { 'data-width': width });
      },
    };
  },
});
