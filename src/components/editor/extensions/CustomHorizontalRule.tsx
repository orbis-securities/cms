import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customHorizontalRule: {
      setHorizontalRule: (attributes?: { class?: string; 'data-align'?: string }) => ReturnType;
    };
  }
}

export const CustomHorizontalRule = HorizontalRule.extend({
  name: 'horizontalRule',

  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('class'),
        renderHTML: (attributes: any) => {
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
        parseHTML: (element: HTMLElement) => element.getAttribute('data-align'),
        renderHTML: (attributes: any) => {
          return {
            'data-align': attributes['data-align'],
          };
        },
      },
    };
  },

  addCommands() {
    return {
      setHorizontalRule: (attributes = {}) => ({ commands }: { commands: any }) => {
        return commands.insertContent({
          type: this.name,
          attrs: mergeAttributes(this.options, attributes),
        });
      },
    };
  },
});
