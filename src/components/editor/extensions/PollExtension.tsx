import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { PollView } from '../views/PollView';

// React Component for the Node View
const PollComponent = ({ node }: { node: any }) => {
  console.log('🟣 PollComponent 렌더링:', {
    'node.attrs': node.attrs,
    'question': node.attrs.question,
    'options': node.attrs.options,
    'allowMultiple': node.attrs.allowMultiple,
    'pollId': node.attrs.pollId
  });

  return (
    <NodeViewWrapper className="poll-widget-wrapper">
      <PollView
        pollId={node.attrs.pollId}
        question={node.attrs.question}
        options={node.attrs.options}
        allowMultiple={node.attrs.allowMultiple}
      />
    </NodeViewWrapper>
  );
};

export interface PollOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    poll: {
      insertPoll: (attributes: {
        question: string;
        options: string[];
        allowMultiple?: boolean;
      }) => ReturnType;
    };
  }
}

// TipTap Extension
export const PollExtension = Node.create<PollOptions>({
  name: 'poll',

  group: 'block',

  atom: true,

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      question: {
        default: '',
        parseHTML: element => element.getAttribute('data-question'),
        renderHTML: attributes => ({
          'data-question': attributes.question,
        }),
      },
      options: {
        default: [],
        parseHTML: element => {
          const optionsStr = element.getAttribute('data-options');
          return optionsStr ? JSON.parse(optionsStr) : [];
        },
        renderHTML: attributes => ({
          'data-options': JSON.stringify(attributes.options),
        }),
      },
      allowMultiple: {
        default: false,
        parseHTML: element => element.getAttribute('data-allow-multiple') === 'true',
        renderHTML: attributes => ({
          'data-allow-multiple': attributes.allowMultiple ? 'true' : 'false',
        }),
      },
      pollId: {
        default: null,
        parseHTML: element => element.getAttribute('data-poll-id'),
        renderHTML: attributes => ({
          'data-poll-id': attributes.pollId || `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="poll"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const optionsStr = element.getAttribute('data-options');
          return {
            question: element.getAttribute('data-question') || '',
            options: optionsStr ? JSON.parse(optionsStr) : [],
            allowMultiple: element.getAttribute('data-allow-multiple') === 'true',
            pollId: element.getAttribute('data-poll-id') || null,
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    console.log('🟢 renderHTML 호출됨:', {
      'node.attrs': node.attrs,
      'question': node.attrs.question,
      'options': node.attrs.options,
      'allowMultiple': node.attrs.allowMultiple,
      'pollId': node.attrs.pollId
    });

    const attrs: Record<string, any> = {
      'data-type': 'poll',
      'data-question': node.attrs.question || '',
      'data-options': JSON.stringify(node.attrs.options || []),
      'data-allow-multiple': node.attrs.allowMultiple ? 'true' : 'false',
      'data-poll-id': node.attrs.pollId || `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    console.log('🟡 생성된 HTML 속성:', attrs);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, attrs),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PollComponent);
  },

  addCommands() {
    return {
      insertPoll:
        (attributes) =>
        ({ commands }) => {
          const pollId = `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          console.log('🔵 insertPoll 호출됨:', {
            question: attributes.question,
            options: attributes.options,
            allowMultiple: attributes.allowMultiple,
            pollId
          });
          return commands.insertContent({
            type: this.name,
            attrs: {
              question: attributes.question,
              options: attributes.options,
              allowMultiple: attributes.allowMultiple || false,
              pollId,
            },
          });
        },
    };
  },
});

export default PollExtension;
