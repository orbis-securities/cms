'use client';

import { Editor } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface DividerToolbarProps {
  editor: Editor;
  getPos: () => number;
}

export function DividerToolbar({ editor, getPos }: DividerToolbarProps) {
  const updateAlignment = (align: 'left' | 'center' | 'right') => {
    const pos = getPos();
    editor.chain()
      .focus()
      .setNodeSelection(pos)
      .updateAttributes('horizontalRule', { 'data-align': align })
      .run();
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-white border rounded-lg shadow-lg">
      <button
        onClick={() => updateAlignment('left')}
        className="p-2 rounded hover:bg-gray-100"
        title="왼쪽 정렬"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => updateAlignment('center')}
        className="p-2 rounded hover:bg-gray-100"
        title="가운데 정렬"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => updateAlignment('right')}
        className="p-2 rounded hover:bg-gray-100"
        title="오른쪽 정렬"
      >
        <AlignRight className="w-4 h-4" />
      </button>
    </div>
  );
}
