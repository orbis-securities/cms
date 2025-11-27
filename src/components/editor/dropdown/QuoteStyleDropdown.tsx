"use client";

import React from 'react';
import { Editor } from '@tiptap/react';

interface QuoteStyleDropdownProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuoteStyleDropdown({ editor, isOpen, onClose }: QuoteStyleDropdownProps) {
  if (!isOpen) return null;

  const applyQuoteStyle = (styleClass: string) => {
    if (!editor) return;

    if (!editor.isActive('blockquote')) {
      editor.chain().focus().toggleBlockquote().run();
    }
    setTimeout(() => {
      editor.chain().focus().updateAttributes('blockquote', { class: styleClass }).run();
    }, 10);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 py-1 z-20 w-48">
      <button
        onClick={() => applyQuoteStyle('quote-style-1')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        따옴표
      </button>
      <button
        onClick={() => applyQuoteStyle('quote-style-2')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        버티컬라인
      </button>
      <button
        onClick={() => applyQuoteStyle('quote-style-3')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        말풍선
      </button>
      <button
        onClick={() => applyQuoteStyle('quote-style-4')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        라인&따옴표
      </button>
      <button
        onClick={() => applyQuoteStyle('quote-style-6')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        프레임
      </button>
    </div>
  );
}
