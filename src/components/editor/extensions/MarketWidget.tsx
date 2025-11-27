import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import MarketWidgetView from '../views/MarketWidgetView';

// React Component for the Node View
const MarketWidgetComponent = ({ node }: { node: any }) => {
  return (
    <NodeViewWrapper className="market-widget-wrapper">
      <MarketWidgetView type={node.attrs.type} symbols={node.attrs.symbols} />
    </NodeViewWrapper>
  );
};

// TypeScript 타입 선언
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    marketWidget: {
      insertMarketWidget: (attributes?: {
        type?: 'coins' | 'exchanges';
        symbols?: string[];
      }) => ReturnType;
    };
  }
}

// TipTap Extension
export const MarketWidget = Node.create({
  name: 'marketWidget',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      type: {
        default: 'coins',
        parseHTML: element => element.getAttribute('data-market-type') || 'coins',
        renderHTML: attributes => {
          return {
            'data-type': attributes.type,
          };
        },
      },
      symbols: {
        default: null,
        parseHTML: element => {
          const symbolsStr = element.getAttribute('data-symbols');
          return symbolsStr ? JSON.parse(symbolsStr) : null;
        },
        renderHTML: attributes => {
          if (!attributes.symbols) return {};
          return {
            'data-symbols': JSON.stringify(attributes.symbols),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="market-widget"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const symbolsStr = element.getAttribute('data-symbols');
          return {
            type: element.getAttribute('data-market-type') || 'coins',
            symbols: symbolsStr ? JSON.parse(symbolsStr) : null,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const attrs: Record<string, any> = {
      'data-type': 'market-widget',
      'data-market-type': node.attrs.type || 'coins',
    };

    if (node.attrs.symbols) {
      attrs['data-symbols'] = JSON.stringify(node.attrs.symbols);
    }

    return [
      'div',
      mergeAttributes(HTMLAttributes, attrs),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MarketWidgetComponent);
  },

  addCommands() {
    return {
      insertMarketWidget:
        (attrs?: { type?: 'coins' | 'exchanges'; symbols?: string[] }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              type: attrs?.type || 'coins',
              symbols: attrs?.symbols || null,
            },
          });
        },
    };
  },
});

export default MarketWidget;
