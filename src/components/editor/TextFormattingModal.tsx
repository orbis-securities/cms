"use client";

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Type, Bold, Italic, Underline } from 'lucide-react';
import { toast } from 'sonner';
import { useRecentColors } from '@/hooks/useRecentColors';

interface TextFormattingModalProps {
  editor: Editor | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function TextFormattingModal({ editor, isVisible, onClose }: TextFormattingModalProps) {
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFont, setSelectedFont] = useState('Pretendard');
  const [selectedSize, setSelectedSize] = useState('16px');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  const { recentTextColors, addRecentTextColor } = useRecentColors();

  const fonts = [
    { name: 'Pretendard', label: 'Pretendard (한국어)' },
    { name: 'Inter', label: 'Inter (모던)' },
    { name: 'Noto Sans KR', label: 'Noto Sans KR' },
    { name: 'Georgia', label: 'Georgia (세리프)' },
    { name: 'Times New Roman', label: 'Times (클래식)' }
  ];

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

  const colorGroups = [
    ['#000000', '#434343', '#666666', '#999999', '#cccccc', '#efefef'],
    ['#cc0000', '#e06666', '#ea9999', '#f4cccc', '#ffffff'],
    ['#ff9900', '#ffad33', '#ffc266', '#ffd699'],
    ['#ffff00', '#ffff99', '#ffffcc'],
    ['#00ff00', '#99ff99', '#ccffcc'],
    ['#0099cc', '#66b2ff', '#99ccff', '#cce5ff'],
    ['#9900ff', '#cc66ff', '#e699ff'],
    ['#ff0099', '#ff66cc', '#ff99dd']
  ];

  // 에디터 상태 동기화
  useEffect(() => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const hasTextSelection = from !== to;
    setHasSelection(hasTextSelection);

    // 현재 스타일 상태 읽기
    setIsBold(editor.isActive('bold'));
    setIsItalic(editor.isActive('italic'));
    setIsUnderline(editor.isActive('underline'));

    // 현재 색상 읽기
    const currentColor = editor.getAttributes('textStyle').color;
    if (currentColor) {
      setSelectedColor(currentColor);
    }
  }, [editor, isVisible]);

  const applyFormatting = () => {
    if (!editor) return;

    // 윈도우 스타일 텍스트 포매팅
    if (hasSelection) {
      // 드래그 선택된 텍스트만 변경
      console.log('🎯 선택된 텍스트에만 스타일 적용');

      editor.chain().focus()
        .setColor(selectedColor)
        .run();

      if (isBold) editor.chain().focus().setBold().run();
      else editor.chain().focus().unsetBold().run();

      if (isItalic) editor.chain().focus().setItalic().run();
      else editor.chain().focus().unsetItalic().run();

      if (isUnderline) editor.chain().focus().setUnderline().run();
      else editor.chain().focus().unsetUnderline().run();

      toast.success('선택된 텍스트 스타일이 적용되었습니다!');
    } else {
      // 앞으로 입력할 텍스트의 기본 스타일 변경
      console.log('🎯 앞으로 입력할 텍스트 기본 스타일 설정');

      // 현재 커서 위치에서 스타일 설정
      const chain = editor.chain().focus();

      chain.setColor(selectedColor);

      if (isBold) chain.setBold();
      else chain.unsetBold();

      if (isItalic) chain.setItalic();
      else chain.unsetItalic();

      if (isUnderline) chain.setUnderline();
      else chain.unsetUnderline();

      chain.run();

      // 에디터 폰트도 변경
      const editorElement = document.querySelector('.ProseMirror');
      if (editorElement) {
        (editorElement as HTMLElement).style.fontFamily = selectedFont;
        (editorElement as HTMLElement).style.fontSize = selectedSize;
      }

      toast.success('기본 텍스트 스타일이 설정되었습니다!');
    }

    // 색상을 최근 사용 목록에 추가
    addRecentTextColor(selectedColor);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[480px] max-h-[600px] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-600" />
            텍스트 포매팅
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* 적용 모드 표시 */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            {hasSelection ? (
              <><strong>선택된 텍스트</strong>에만 스타일이 적용됩니다.</>
            ) : (
              <><strong>앞으로 입력할 텍스트</strong>의 기본 스타일이 설정됩니다.</>
            )}
          </p>
        </div>

        {/* 텍스트 색상 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">텍스트 색상</label>
          <div className="flex gap-1 mb-3">
            {colorGroups.flat().map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 border-2 rounded hover:scale-110 transition-transform ${
                  selectedColor === color ? 'ring-2 ring-blue-400' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        {/* 최근 사용한 색상 */}
        {recentTextColors.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">최근 사용한 색상</label>
            <div className="flex gap-1 flex-wrap">
              {recentTextColors.map((color, index) => (
                <button
                  key={`recent-${color}-${index}`}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 border-2 rounded hover:scale-110 transition-transform ${
                    selectedColor === color ? 'ring-2 ring-blue-400' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* 폰트 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">폰트</label>
          <select
            value={selectedFont}
            onChange={(e) => setSelectedFont(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {fonts.map((font) => (
              <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                {font.label}
              </option>
            ))}
          </select>
        </div>

        {/* 글자 크기 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">글자 크기</label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {fontSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* 글자 스타일 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">글자 스타일</label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBold(!isBold)}
              className={`flex items-center gap-2 px-3 py-2 border rounded ${
                isBold ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Bold className="w-4 h-4" />
              굵게
            </button>
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={`flex items-center gap-2 px-3 py-2 border rounded ${
                isItalic ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Italic className="w-4 h-4" />
              기울임
            </button>
            <button
              onClick={() => setIsUnderline(!isUnderline)}
              className={`flex items-center gap-2 px-3 py-2 border rounded ${
                isUnderline ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Underline className="w-4 h-4" />
              밑줄
            </button>
          </div>
        </div>

        {/* 적용 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={applyFormatting}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ✨ 적용
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}