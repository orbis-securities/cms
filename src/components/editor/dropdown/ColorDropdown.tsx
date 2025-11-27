"use client";

import React from 'react';
import { Editor } from '@tiptap/react';

interface ColorDropdownProps {
  type: 'text' | 'background';
  editor: Editor | null;
  isOpen: boolean;
  recentColors: string[];
  onAddColor: (color: string) => void;
}

const COLOR_CONFIGS = {
  text: {
    palette: [
      '#000000', '#374151', '#6B7280', '#9CA3AF',
      '#EF4444', '#F97316', '#EAB308', '#22C55E',
      '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'
    ],
    defaultColor: '#000000',
    attribute: 'textStyle',
    removeTitle: '색상 없음',
    setColor: (editor: Editor, color: string) => {
      editor.chain().focus().setColor(color).run();
    },
    unsetColor: (editor: Editor) => {
      editor.chain().focus().unsetColor().run();
    },
    getColor: (editor: Editor) => editor.getAttributes('textStyle')?.color
  },
  background: {
    palette: [
      '#FFFF00', '#FFE599', '#FFD966', '#FFF2CC',
      '#EA9999', '#F4CCCC', '#FCE5CD', '#D9EAD3',
      '#CFE2F3', '#D9D2E9', '#EAD1DC', '#F3F3F3'
    ],
    defaultColor: '#FFFF00',
    attribute: 'highlight',
    removeTitle: '배경색 없음',
    setColor: (editor: Editor, color: string) => {
      editor.chain().focus().setHighlight({ color }).run();
    },
    unsetColor: (editor: Editor) => {
      editor.chain().focus().unsetHighlight().run();
    },
    getColor: (editor: Editor) => editor.getAttributes('highlight')?.color
  }
};

export default function ColorDropdown({
  type,
  editor,
  isOpen,
  recentColors,
  onAddColor
}: ColorDropdownProps) {
  if (!isOpen) return null;

  const config = COLOR_CONFIGS[type];

  const handleColorSelect = (color: string) => {
    if (editor) {
      config.setColor(editor, color);
      onAddColor(color);
    }
  };

  const handleColorRemove = () => {
    if (editor) {
      config.unsetColor(editor);
    }
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 p-3 z-20 w-56">
      <div className="grid grid-cols-8 gap-1 mb-2">
        {/* 색상 없음 버튼 */}
        <button
          onClick={handleColorRemove}
          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform bg-white relative"
          title={config.removeTitle}
        >
          <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-xs">✕</span>
        </button>

        {/* 기본 색상 팔레트 */}
        {config.palette.map((color) => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* 커스텀 색상 */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-1">커스텀 색상</div>
        <input
          type="color"
          value={editor ? (config.getColor(editor) || config.defaultColor) : config.defaultColor}
          onChange={(e) => handleColorSelect(e.target.value)}
          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      {/* 최근 사용 색상 */}
      {recentColors.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-1">최근 사용</div>
          <div className="flex gap-1">
            {recentColors.slice(0, 6).map((color, index) => (
              <button
                key={`recent-${type}-${color}-${index}`}
                onClick={() => {
                  if (editor) {
                    config.setColor(editor, color);
                  }
                }}
                className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
