"use client";

import React from 'react';
import { Editor } from '@tiptap/react';
import { Hash } from 'lucide-react';

interface SymbolDropdownProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SymbolDropdown({ editor, isOpen, onClose }: SymbolDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 p-4 z-20 w-80">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Hash className="w-4 h-4 text-blue-600" />
        특수문자 & 기호
      </h4>

      {/* 자주 사용하는 기호들 */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">💼 자주 사용</div>
        <div className="grid grid-cols-8 gap-2 mb-3">
          {[
            '•', '◦', '▪', '▫', '■', '□', '●', '○',
            '★', '☆', '▲', '△', '▼', '▽', '◆', '◇',
            '→', '←', '↑', '↓', '↔', '↕', '⇒', '⇐',
            '✓', '✗', '✕', '±', '∞', '≈', '≠', '≤'
          ].map((symbol, index) => (
            <button
              key={`frequent-${index}`}
              onClick={() => {
                if (editor) {
                  editor.chain().focus().insertContent(symbol).run();
                }
              }}
              className="w-8 h-8 text-lg rounded hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110"
              title={`${symbol} 삽입`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 수학/과학 기호 */}
      <div className="mb-4 border-t pt-3">
        <div className="text-xs text-gray-400 mb-2">🔬 수학/과학</div>
        <div className="grid grid-cols-8 gap-2 mb-3">
          {[
            '×', '÷', '+', '−', '=', '≥', '≤', '%',
            '‰', '°', '′', '″', '∴', '∵', '∝', '∈',
            '∉', '∑', '∏', '∫', '∂', '∇', 'α', 'β',
            'γ', 'δ', 'π', 'λ', 'μ', 'σ', 'φ', 'ω'
          ].map((symbol, index) => (
            <button
              key={`math-${index}`}
              onClick={() => {
                if (editor) {
                  editor.chain().focus().insertContent(symbol).run();
                }
              }}
              className="w-8 h-8 text-lg rounded hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110"
              title={`${symbol} 삽입`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 통화/기타 */}
      <div className="border-t pt-3">
        <div className="text-xs text-gray-400 mb-2">💰 통화/기타</div>
        <div className="grid grid-cols-8 gap-2 mb-3">
          {[
            '$', '€', '£', '¥', '₩', '¢', '©', '®',
            '™', '§', '¶', '†', '‡', '‰', '‱', '¿',
            '¡', '«', '»', '@', '#', '%', '&', '…'
          ].map((symbol, index) => (
            <button
              key={`symbol-${index}-${symbol}`}
              onClick={() => {
                if (editor) {
                  editor.chain().focus().insertContent(symbol).run();
                }
              }}
              className="w-8 h-8 text-lg rounded hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110"
              title={`${symbol} 삽입`}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 빠른 닫기 버튼 */}
      <div className="text-center mt-3 pt-3 border-t">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
