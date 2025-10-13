import Blockquote from '@tiptap/extension-blockquote';
import type { ChainedCommands } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customBlockquote: {
      setBlockquoteStyle: (className: string) => ReturnType;
      setBlockquoteAlign: (align: string) => ReturnType;
      setBlockquoteWidth: (width: string) => ReturnType;
      setBlockquoteFloat: (float: string) => ReturnType;
    };
  }
}

export const CustomBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: 'quote-style-1',
        parseHTML: element => element.getAttribute('class') || 'quote-style-1',
        renderHTML: attributes => {
          return {
            class: attributes.class || 'quote-style-1',
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
      'data-float': {
        default: 'none',
        parseHTML: element => element.getAttribute('data-float'),
        renderHTML: attributes => {
          return {
            'data-float': attributes['data-float'] || 'none',
          };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    // style 속성 제거 (class 기반 스타일만 사용)
    const { style, ...cleanAttributes } = HTMLAttributes;

    // node의 attrs에서 직접 속성들을 가져와서 명시적으로 설정
    return [
      'blockquote',
      {
        ...cleanAttributes,
        class: node.attrs.class || 'quote-style-1',
        'data-align': node.attrs['data-align'] || 'center',
        'data-width': node.attrs['data-width'] || '30%',
        'data-float': node.attrs['data-float'] || 'none',
      },
      0
    ];
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
      setBlockquoteFloat: (float: string) => ({ commands }: { commands: ChainedCommands }) => {
        return commands.updateAttributes('blockquote', { 'data-float': float });
      },
    };
  },
});
