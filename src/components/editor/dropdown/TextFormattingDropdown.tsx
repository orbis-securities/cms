"use client";

import React from 'react';
import { Editor } from '@tiptap/react';

interface TextFormattingDropdownProps {
  editor: Editor | null;
  isOpen: boolean;
}

export default function TextFormattingDropdown({ editor, isOpen }: TextFormattingDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 p-4 z-20 w-64">
      {/* 폰트 크기 조절 */}
      <div className="mb-3">
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            min="8"
            max="200"
            placeholder="크기"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                const fontSize = input.value;
                if (editor && fontSize) {
                  (editor as any).chain().focus().setFontSize(`${fontSize}px`).run();
                }
              }
            }}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              if (editor) {
                (editor as any).chain().focus().unsetFontSize().run();
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            title="기본 크기로"
          >
            초기화
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96].map((size) => (
            <button
              key={size}
              onClick={() => {
                if (editor) {
                  (editor as any).chain().focus().setFontSize(`${size}px`).run();
                }
              }}
              className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
              title={`${size}px`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* 행간 조절 */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">행간</div>
        <select
          onChange={(e) => {
            const lineHeight = e.target.value;
            if (editor) {
              const { from, to } = editor.state.selection;

              if (from !== to) {
                const selectedText = editor.state.doc.textBetween(from, to);
                editor.chain()
                  .focus()
                  .deleteSelection()
                  .insertContent(
                    `<span style="line-height: ${lineHeight};">${selectedText}</span>`
                  )
                  .run();
              } else {
                const resolvedPos = editor.state.doc.resolve(from);
                const nodePos = resolvedPos.before(resolvedPos.depth);
                const node = resolvedPos.parent;

                if (node && node.type.name === 'paragraph') {
                  editor.chain()
                    .focus()
                    .setTextSelection({ from: nodePos + 1, to: nodePos + node.nodeSize - 1 })
                    .run();

                  const paragraphText = editor.state.doc.textBetween(nodePos + 1, nodePos + node.nodeSize - 1);

                  editor.chain()
                    .focus()
                    .deleteSelection()
                    .insertContent(
                      `<p style="line-height: ${lineHeight};">${paragraphText}</p>`
                    )
                    .run();
                }
              }
            }
          }}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          defaultValue="1.5"
        >
          <option value="0.5">50%</option>
          <option value="0.6">60%</option>
          <option value="0.7">70%</option>
          <option value="0.8">80%</option>
          <option value="0.9">90%</option>
          <option value="1.0">100%</option>
          <option value="1.1">110%</option>
          <option value="1.2">120%</option>
          <option value="1.3">130%</option>
          <option value="1.4">140%</option>
          <option value="1.5">150%</option>
        </select>
      </div>

      {/* 정렬 + 스타일 */}
      <div className="flex items-center justify-between">
        {/* 정렬 */}
        <div>
          <div className="text-xs text-gray-500 mb-1">정렬</div>
          <div className="flex border border-gray-200 rounded overflow-hidden">
            <button
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              className={`px-2 py-1 text-sm ${
                editor?.isActive({ textAlign: 'left' })
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-50'
              }`}
              title="왼쪽 정렬"
            >
              ⬅
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('center').run()}
              className={`px-2 py-1 text-sm border-x ${
                editor?.isActive({ textAlign: 'center' })
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-50'
              }`}
              title="가운데 정렬"
            >
              ↔
            </button>
            <button
              onClick={() => editor?.chain().focus().setTextAlign('right').run()}
              className={`px-2 py-1 text-sm ${
                editor?.isActive({ textAlign: 'right' })
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-50'
              }`}
              title="오른쪽 정렬"
            >
              ➡
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
