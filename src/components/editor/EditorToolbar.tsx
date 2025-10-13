"use client";

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  TableIcon,
  ImageIcon,
  Type,
  Palette,
  Sparkles,
  Smile,
  Hash,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import CustomEmojiPicker from './EmojiPicker';
import SymbolSelectModal from './SymbolSelectModal';
import PollConfigModal from './PollConfigModal';
import ChartDialog from './ChartDialog';
import { createRoot } from 'react-dom/client';
// import ColorPalette from './ColorPalette';
// import FontSelector from './FontSelector';

interface EditorToolbarProps {
  editor: Editor | null;
  showTableDropdown: boolean;
  setShowTableDropdown: (show: boolean) => void;
  tableRows: number;
  setTableRows: (rows: number) => void;
  tableCols: number;
  setTableCols: (cols: number) => void;
  onCreateTable: () => void;
  onImageUpload: (file: File) => Promise<string>;
  onAIButtonClick: () => void;
  showTextFormattingDropdown: boolean;
  onTextFormattingClick: () => void;
  showAICompletion: boolean;
}

export default function EditorToolbar({
  editor,
  showTableDropdown,
  setShowTableDropdown,
  tableRows,
  setTableRows,
  tableCols,
  setTableCols,
  onCreateTable,
  onImageUpload,
  onAIButtonClick,
  showTextFormattingDropdown,
  onTextFormattingClick,
  showAICompletion
}: EditorToolbarProps) {
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [currentSessionColors, setCurrentSessionColors] = useState<string[]>([]);
  const [recentBgColors, setRecentBgColors] = useState<string[]>([]);
  const [currentSessionBgColors, setCurrentSessionBgColors] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [showQuoteStyleDropdown, setShowQuoteStyleDropdown] = useState(false);
  const [showDividerDropdown, setShowDividerDropdown] = useState(false);
  const [showMarketWidgetDropdown, setShowMarketWidgetDropdown] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showChartDialog, setShowChartDialog] = useState(false);

  // 최근 색상 불러오기 (모달 열 때)
  useEffect(() => {
    if (showTextFormattingDropdown) {
      const savedTextColors = localStorage.getItem('recentTextColors');
      if (savedTextColors) {
        setRecentColors(JSON.parse(savedTextColors));
      }

      const savedBgColors = localStorage.getItem('recentBgColors');
      if (savedBgColors) {
        setRecentBgColors(JSON.parse(savedBgColors));
      }
    }
  }, [showTextFormattingDropdown]);

  // 외부 클릭 감지로 드롭다운 자동 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 텍스트 포매팅 드롭다운 외부 클릭 시 닫기
      if (showTextFormattingDropdown && !target.closest('.text-formatting-container')) {
        onTextFormattingClick();
      }

      // 표 드롭다운 외부 클릭 시 닫기
      if (showTableDropdown && !target.closest('.table-dropdown-container')) {
        setShowTableDropdown(false);
      }

      // 이모지 드롭다운 외부 클릭 시 닫기
      if (showEmojiPicker && !target.closest('.emoji-dropdown-container')) {
        setShowEmojiPicker(false);
      }

      // 기호 드롭다운 외부 클릭 시 닫기
      if (showSymbolDropdown && !target.closest('.symbol-dropdown-container')) {
        setShowSymbolDropdown(false);
      }

      // 인용구 스타일 드롭다운 외부 클릭 시 닫기
      if (showQuoteStyleDropdown && !target.closest('.quote-style-dropdown-container')) {
        setShowQuoteStyleDropdown(false);
      }

      // 구분선 드롭다운 외부 클릭 시 닫기
      if (showDividerDropdown && !target.closest('.divider-dropdown-container')) {
        setShowDividerDropdown(false);
      }

      // 시장 위젯 드롭다운 외부 클릭 시 닫기
      if (showMarketWidgetDropdown && !target.closest('.market-widget-dropdown-container')) {
        setShowMarketWidgetDropdown(false);
      }

      // AI 드롭다운 외부 클릭 시 닫기
      // showAICompletion 대신 실제 AI 드롭다운 표시 상태를 확인해야 함
      // 일단 주석 처리 - AdvancedNovelEditor에서 처리하도록 함
      // if (showAIDropdown && !target.closest('.ai-dropdown-container') && !target.closest('.ai-button-container')) {
      //   onAIButtonClick();
      // }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTextFormattingDropdown, onTextFormattingClick, showTableDropdown, showEmojiPicker, showSymbolDropdown, showQuoteStyleDropdown, showDividerDropdown, showMarketWidgetDropdown, showPollModal, showAICompletion, onAIButtonClick]);

  // 모달 닫힐 때 최근 색상 업데이트
  useEffect(() => {
    if (!showTextFormattingDropdown) {
      // 텍스트 색상 업데이트
      if (currentSessionColors.length > 0) {
        const saved = localStorage.getItem('recentTextColors');
        const existing = saved ? JSON.parse(saved) : [];

        let updated = [...existing];
        currentSessionColors.reverse().forEach(color => {
          updated = updated.filter(c => c !== color);
          updated.unshift(color);
        });

        updated = updated.slice(0, 6);
        localStorage.setItem('recentTextColors', JSON.stringify(updated));
        setRecentColors(updated);
        setCurrentSessionColors([]);
      }

      // 배경색 업데이트
      if (currentSessionBgColors.length > 0) {
        const saved = localStorage.getItem('recentBgColors');
        const existing = saved ? JSON.parse(saved) : [];

        let updated = [...existing];
        currentSessionBgColors.reverse().forEach(color => {
          updated = updated.filter(c => c !== color);
          updated.unshift(color);
        });

        updated = updated.slice(0, 6);
        localStorage.setItem('recentBgColors', JSON.stringify(updated));
        setRecentBgColors(updated);
        setCurrentSessionBgColors([]);
      }
    }
  }, [showTextFormattingDropdown, currentSessionColors, currentSessionBgColors]);

  // 세션 중 색상 추가 함수
  const addSessionColor = (color: string) => {
    setCurrentSessionColors(prev => {
      if (!prev.includes(color)) {
        return [...prev, color];
      }
      return prev;
    });
  };

  const addSessionBgColor = (color: string) => {
    setCurrentSessionBgColors(prev => {
      if (!prev.includes(color)) {
        return [...prev, color];
      }
      return prev;
    });
  };

  return (
    <div className="border-b p-2 flex items-center gap-1 bg-gray-50">
      {/* AI 버튼 */}
      <div className="relative ai-button-container">
        <button
          onClick={onAIButtonClick}
          disabled={showAICompletion}
          className={`p-2 rounded hover:bg-purple-50 border border-purple-200 transition-all ${
            showAICompletion ? 'bg-purple-100 text-purple-600' : 'text-purple-600 hover:border-purple-300'
          }`}
          title="AI 도움받기"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 텍스트 포매팅 (드롭다운) */}
      <div className="relative text-formatting-container">
        <button
          onClick={onTextFormattingClick}
          className="p-2 rounded hover:bg-gray-100 border border-gray-200"
          title="텍스트 포매팅 (색상, 정렬, 스타일)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* 텍스트 포매팅 드롭다운 (심플 버전) */}
        {showTextFormattingDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-20 w-64">
            {/* 색상 팔레트 */}
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 mb-2">색상</div>
              <div className="grid grid-cols-8 gap-1 mb-2">
                {[
                  '#000000', '#374151', '#6B7280', '#9CA3AF',
                  '#EF4444', '#F97316', '#EAB308', '#22C55E',
                  '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      if (editor) {
                        editor.chain().focus().setColor(color).run();
                        addSessionColor(color);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (editor) {
                        editor.chain().focus().setHighlight({ color }).run();
                        addSessionBgColor(color);
                      }
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-105 transition-transform"
                    style={{ backgroundColor: color }}
                    title={`좌클릭: 글자색 | 우클릭: 배경색`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-400 mb-1">💡 좌클릭: 글자색, 우클릭: 배경색</div>

              {/* 최근 사용 색상 (최대 4개) */}
              {recentColors.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">최근 사용</div>
                  <div className="flex gap-1">
                    {recentColors.slice(0, 4).map((color, index) => (
                      <button
                        key={`recent-${color}-${index}`}
                        onClick={() => {
                          if (editor) {
                            editor.chain().focus().setColor(color).run();
                          }
                        }}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-105 transition-transform"
                        style={{ backgroundColor: color }}
                        title={`최근 사용: ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 커스텀 색상 */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">글자색</div>
                  <input
                    type="color"
                    value={editor?.getAttributes('textStyle')?.color || '#000000'}
                    onChange={(e) => {
                      const color = e.target.value;
                      if (editor) {
                        editor.chain().focus().setColor(color).run();
                        addSessionColor(color);
                      }
                    }}
                    className="w-full h-7 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">배경색</div>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={editor?.getAttributes('highlight')?.color || '#ffff00'}
                      onChange={(e) => {
                        const color = e.target.value;
                        if (editor) {
                          editor.chain().focus().setHighlight({ color }).run();
                          addSessionBgColor(color);
                        }
                      }}
                      className="flex-1 h-7 border border-gray-300 rounded cursor-pointer"
                    />
                    <button
                      onClick={() => {
                        if (editor) {
                          editor.chain().focus().unsetHighlight().run();
                        }
                      }}
                      className="px-2 h-7 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      title="배경색 제거"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 폰트 크기 조절 */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">글자 크기 (px)</div>
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
                    // 간단한 방법: 선택된 범위를 <span>으로 감싸고 line-height 적용
                    const { from, to } = editor.state.selection;

                    if (from !== to) {
                      // 텍스트가 선택된 경우
                      const selectedText = editor.state.doc.textBetween(from, to);
                      editor.chain()
                        .focus()
                        .deleteSelection()
                        .insertContent(
                          `<span style="line-height: ${lineHeight};">${selectedText}</span>`
                        )
                        .run();
                    } else {
                      // 선택이 없는 경우: 현재 커서가 있는 문단 전체에 적용
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

              {/* 스타일 */}
              <div>
                <div className="text-xs text-gray-500 mb-1">스타일</div>
                <div className="flex gap-1">
                  <button
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`w-7 h-7 text-sm border rounded ${
                      editor?.isActive('bold') ? 'bg-blue-500 text-white' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="굵게"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`w-7 h-7 text-sm border rounded ${
                      editor?.isActive('italic') ? 'bg-blue-500 text-white' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="기울기"
                  >
                    <em>I</em>
                  </button>
                  <button
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    className={`w-7 h-7 text-sm border rounded ${
                      editor?.isActive('underline') ? 'bg-blue-500 text-white' : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    title="밑줄"
                  >
                    <u>U</u>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 이모지 선택기 */}
      <div className="relative emoji-dropdown-container">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded hover:bg-gray-100 border border-gray-200"
          title="이모지 삽입"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* 이모지 픽커 드롭다운 */}
        {showEmojiPicker && (
          <CustomEmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiSelect={(emoji) => {
              if (editor) {
                editor.chain().focus().insertContent(emoji).run();
              }
            }}
          />
        )}
      </div>

      {/* 기호 선택기 */}
      <div className="relative symbol-dropdown-container">
        <button
          onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
          className="p-2 rounded hover:bg-gray-100 border border-gray-200"
          title="특수문자/기호 삽입"
        >
          <Hash className="w-4 h-4" />
        </button>

        {/* 기호 드롭다운 */}
        {showSymbolDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-20 w-80">
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
                onClick={() => setShowSymbolDropdown(false)}
                className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''
        }`}
        title="글머리 기호 목록"
      >
        <List className="w-4 h-4" />
      </button>

      {/* 인용구 스타일 선택기 */}
      <div className="relative quote-style-dropdown-container">
        <button
          onClick={() => setShowQuoteStyleDropdown(!showQuoteStyleDropdown)}
          className={`p-2 rounded hover:bg-gray-100 ${
            editor?.isActive('blockquote') ? 'bg-blue-100 text-blue-600' : ''
          }`}
          title="인용구 스타일"
        >
          <Quote className="w-4 h-4" />
        </button>

        {/* 인용구 스타일 드롭다운 */}
        {showQuoteStyleDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-20 w-48">
            <button
              onClick={() => {
                if (editor) {
                  if (!editor.isActive('blockquote')) {
                    editor.chain().focus().toggleBlockquote().run();
                  }
                  setTimeout(() => {
                    editor.chain().focus().updateAttributes('blockquote', { class: 'quote-style-1' }).run();
                  }, 10);
                }
                setShowQuoteStyleDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              따옴표
            </button>
            <button
              onClick={() => {
                if (editor) {
                  if (!editor.isActive('blockquote')) {
                    editor.chain().focus().toggleBlockquote().run();
                  }
                  setTimeout(() => {
                    editor.chain().focus().updateAttributes('blockquote', { class: 'quote-style-2' }).run();
                  }, 10);
                }
                setShowQuoteStyleDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              버티컬라인
            </button>
            <button
              onClick={() => {
                if (editor) {
                  if (!editor.isActive('blockquote')) {
                    editor.chain().focus().toggleBlockquote().run();
                  }
                  setTimeout(() => {
                    editor.chain().focus().updateAttributes('blockquote', { class: 'quote-style-3' }).run();
                  }, 10);
                }
                setShowQuoteStyleDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              말풍선
            </button>
            <button
              onClick={() => {
                if (editor) {
                  if (!editor.isActive('blockquote')) {
                    editor.chain().focus().toggleBlockquote().run();
                  }
                  setTimeout(() => {
                    editor.chain().focus().updateAttributes('blockquote', { class: 'quote-style-4' }).run();
                  }, 10);
                }
                setShowQuoteStyleDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              라인&따옴표
            </button>
            <button
              onClick={() => {
                if (editor) {
                  if (!editor.isActive('blockquote')) {
                    editor.chain().focus().toggleBlockquote().run();
                  }
                  setTimeout(() => {
                    editor.chain().focus().updateAttributes('blockquote', { class: 'quote-style-6' }).run();
                  }, 10);
                }
                setShowQuoteStyleDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              프레임
            </button>
          </div>
        )}
      </div>

      {/* 구분선 선택기 */}
      <div className="relative divider-dropdown-container">
        <button
          onClick={() => setShowDividerDropdown(!showDividerDropdown)}
          className="p-2 rounded hover:bg-gray-100"
          title="구분선 삽입"
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* 구분선 드롭다운 */}
        {showDividerDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-20 w-48">
            <button
              onClick={() => {
                if (editor) {
                  editor.chain()
                    .focus()
                    .setHorizontalRule({ class: 'divider-short' })
                    .run();
                }
                setShowDividerDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              짧은 기본선
            </button>
            <button
              onClick={() => {
                if (editor) {
                  editor.chain()
                    .focus()
                    .setHorizontalRule({ class: 'divider-long' })
                    .run();
                }
                setShowDividerDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              긴 기본선
            </button>
            <button
              onClick={() => {
                if (editor) {
                  editor.chain()
                    .focus()
                    .setHorizontalRule({ class: 'divider-thick' })
                    .run();
                }
                setShowDividerDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              짧은 두꺼운선
            </button>
            <button
              onClick={() => {
                if (editor) {
                  editor.chain()
                    .focus()
                    .setHorizontalRule({ class: 'divider-dashed' })
                    .run();
                }
                setShowDividerDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              점선
            </button>
            <button
              onClick={() => {
                if (editor) {
                  editor.chain()
                    .focus()
                    .setHorizontalRule({ class: 'divider-vertical' })
                    .run();
                }
                setShowDividerDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              세로 선
            </button>
          </div>
        )}
      </div>
      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 링크 */}
      <button
        onClick={() => {
          const url = window.prompt('링크 URL을 입력하세요:');
          if (url) {
            editor?.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor?.isActive('link') ? 'bg-blue-100 text-blue-600' : ''
        }`}
      >
        <LinkIcon className="w-4 h-4" />
      </button>

      {/* YouTube */}
      <button
        onClick={() => {
          const url = window.prompt('YouTube URL을 입력하세요:');
          if (url) {
            editor?.chain().focus().setYoutubeVideo({ src: url }).run();
          }
        }}
        className="p-2 rounded hover:bg-gray-100"
        title="YouTube 동영상"
      >
        <YoutubeIcon className="w-4 h-4" />
      </button>

      {/* 표 생성 */}
      <div className="relative table-dropdown-container">
        <button
          onClick={() => setShowTableDropdown(!showTableDropdown)}
          className="p-2 rounded hover:bg-gray-100"
          title="테이블 삽입"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        {showTableDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-3 z-20 min-w-[240px]">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-green-600" />
              표 크기 설정
            </h4>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">행 수:</label>
                <select
                  value={tableRows}
                  onChange={(e) => setTableRows(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}행</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">열 수:</label>
                <select
                  value={tableCols}
                  onChange={(e) => setTableCols(Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}열</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-2 rounded text-center mb-3">
              <span className="text-xs text-gray-600">
                미리보기: <strong>{tableRows} × {tableCols}</strong> 표
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onCreateTable}
                className="flex-1 bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
              >
                표 생성
              </button>
              <button
                onClick={() => setShowTableDropdown(false)}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 이미지 업로드 */}
      <button
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true; // 다중 선택 활성화
          input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              // 모든 파일을 순차적으로 업로드
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                  const url = await onImageUpload(file);
                  // 각 이미지를 HTML로 삽입하여 덮어쓰기 방지
                  editor?.chain().focus().insertContent(`<img src="${url}" style="display: inline-block; max-width: 100%; height: auto;" /><p></p>`).run();
                } catch (error) {
                  console.error(`이미지 업로드 실패: ${file.name}`, error);
                }
              }
            }
          };
          input.click();
        }}
        className="p-2 rounded hover:bg-gray-100"
        title="이미지 업로드 (다중 선택 가능)"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* 시장 위젯 */}
      <div className="relative market-widget-dropdown-container">
        <button
          onClick={() => setShowMarketWidgetDropdown(!showMarketWidgetDropdown)}
          className="p-2 rounded hover:bg-gray-100"
          title="시장 위젯 삽입"
        >
          <TrendingUp className="w-4 h-4" />
        </button>

        {/* 시장 위젯 드롭다운 */}
        {showMarketWidgetDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-20 w-48">
            <button
              onClick={() => {
                if (editor) {
                  // 모달 컨테이너 생성
                  const modalContainer = document.createElement('div');
                  document.body.appendChild(modalContainer);
                  const root = createRoot(modalContainer);

                  const handleClose = () => {
                    root.unmount();
                    setTimeout(() => {
                      if (modalContainer.parentNode) {
                        modalContainer.parentNode.removeChild(modalContainer);
                      }
                    }, 0);
                  };

                  const handleConfirm = (symbols: string[]) => {
                    editor
                      .chain()
                      .focus()
                      .insertMarketWidget({ type: 'coins', symbols })
                      .run();
                    handleClose();
                  };

                  root.render(
                    React.createElement(SymbolSelectModal, {
                      isOpen: true,
                      onClose: handleClose,
                      onConfirm: handleConfirm,
                      type: 'coins',
                    })
                  );
                }
                setShowMarketWidgetDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              암호화폐
            </button>
            <button
              onClick={() => {
                if (editor) {
                  // 모달 컨테이너 생성
                  const modalContainer = document.createElement('div');
                  document.body.appendChild(modalContainer);
                  const root = createRoot(modalContainer);

                  const handleClose = () => {
                    root.unmount();
                    setTimeout(() => {
                      if (modalContainer.parentNode) {
                        modalContainer.parentNode.removeChild(modalContainer);
                      }
                    }, 0);
                  };

                  const handleConfirm = (symbols: string[]) => {
                    editor
                      .chain()
                      .focus()
                      .insertMarketWidget({ type: 'exchanges', symbols })
                      .run();
                    handleClose();
                  };

                  root.render(
                    React.createElement(SymbolSelectModal, {
                      isOpen: true,
                      onClose: handleClose,
                      onConfirm: handleConfirm,
                      type: 'exchanges',
                    })
                  );
                }
                setShowMarketWidgetDropdown(false);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
            >
              환율
            </button>
          </div>
        )}
      </div>

      {/* 투표/설문조사 */}
      <button
        onClick={() => setShowPollModal(true)}
        className="p-2 rounded hover:bg-gray-100"
        title="투표/설문조사 삽입"
      >
        <BarChart3 className="w-4 h-4" />
      </button>

      {/* 투표 설정 모달 */}
      <PollConfigModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onConfirm={(config) => {
          if (editor) {
            (editor as any).chain().focus().insertPoll(config).run();
          }
          setShowPollModal(false);
        }}
      />

      {/* 차트 */}
      <button
        onClick={() => setShowChartDialog(true)}
        className="p-2 rounded hover:bg-gray-100"
        title="차트/그래프 삽입"
      >
        <LineChartIcon className="w-4 h-4" />
      </button>

      {/* 차트 다이얼로그 */}
      <ChartDialog
        isOpen={showChartDialog}
        onClose={() => setShowChartDialog(false)}
        onInsert={(chartType, data, title, units, colors) => {
          console.log('🎯 EditorToolbar onInsert 호출:', {
            chartType,
            dataLength: data.length,
            title,
            units,
            colors
          });
          if (editor) {
            (editor as any).chain().focus().insertChart({ chartType, data, title, units, colors }).run();
          }
        }}
      />
    </div>
  );
}