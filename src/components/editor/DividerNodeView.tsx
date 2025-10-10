'use client';

import { NodeViewWrapper } from '@tiptap/react';
import { DividerToolbar } from './DividerToolbar';

export function DividerNodeView({ node, getPos, editor, selected }: any) {
  return (
    <NodeViewWrapper className="relative divider-wrapper group">
      <div className="relative">
        <hr
          className={node.attrs.class || ''}
          data-align={node.attrs['data-align'] || 'center'}
          style={{
            cursor: 'pointer',
            outline: selected ? '2px solid #3b82f6' : 'none',
            outlineOffset: '2px',
          }}
        />
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <DividerToolbar editor={editor} getPos={getPos} />
        </div>
      </div>
    </NodeViewWrapper>
  );
}
