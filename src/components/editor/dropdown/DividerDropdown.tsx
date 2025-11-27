"use client";

import React from 'react';
import { Editor } from '@tiptap/react';

interface DividerDropdownProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DividerDropdown({ editor, isOpen, onClose }: DividerDropdownProps) {
  if (!isOpen) return null;

  const insertDivider = (className: string) => {
    if (!editor) return;
    editor.chain().focus().setHorizontalRule({ class: className }).run();
    onClose();
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 py-1 z-20 w-48">
      <button
        onClick={() => insertDivider('divider-short')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        짧은 기본선
      </button>
      <button
        onClick={() => insertDivider('divider-long')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        긴 기본선
      </button>
      <button
        onClick={() => insertDivider('divider-thick')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        짧은 두꺼운선
      </button>
      <button
        onClick={() => insertDivider('divider-dashed')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        점선
      </button>
      <button
        onClick={() => insertDivider('divider-vertical')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        세로 선
      </button>
    </div>
  );
}
