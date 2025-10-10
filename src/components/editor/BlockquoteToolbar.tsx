"use client";

import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Editor } from '@tiptap/react';

interface BlockquoteToolbarProps {
  editor: Editor;
  position: { x: number; y: number };
  onClose: () => void;
  currentAlign: 'left' | 'center' | 'right';
}

export default function BlockquoteToolbar({
  editor,
  position,
  onClose,
  currentAlign
}: BlockquoteToolbarProps) {
  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    editor.chain().focus().updateAttributes('blockquote', { 'data-align': align }).run();
  };

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-50 flex items-center gap-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* 정렬 버튼 */}
      <div className="flex items-center gap-1 border-r pr-2">
        <button
          onClick={() => handleAlignChange('left')}
          className={`p-2 rounded hover:bg-gray-100 ${
            currentAlign === 'left' ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="왼쪽 정렬"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAlignChange('center')}
          className={`p-2 rounded hover:bg-gray-100 ${
            currentAlign === 'center' ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="가운데 정렬"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleAlignChange('right')}
          className={`p-2 rounded hover:bg-gray-100 ${
            currentAlign === 'right' ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="오른쪽 정렬"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
      >
        닫기
      </button>
    </div>
  );
}
