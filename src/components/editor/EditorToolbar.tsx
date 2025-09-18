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
  Sparkles
} from 'lucide-react';
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTextFormattingDropdown, onTextFormattingClick]);

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
      <div className="relative">
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
          className="px-3 py-2 rounded hover:bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 flex items-center gap-2"
          title="텍스트 포매팅 (색상, 폰트, 크기, 굵기, 기울기)"
        >
          <Type className="w-4 h-4" />
          텍스트
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

            {/* 행간 조절 */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">행간</div>
              <select
                onChange={(e) => {
                  const lineHeight = e.target.value;
                  if (editor) {
                    // 선택된 텍스트나 현재 문단에 행간 적용
                    const { from, to } = editor.state.selection;
                    editor.chain().focus().setTextSelection({ from, to }).run();

                    // DOM 조작으로 선택된 영역에 line-height 적용
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      const container = range.commonAncestorContainer;
                      let element = container.nodeType === Node.TEXT_NODE
                        ? container.parentElement
                        : container as Element;

                      // 가장 가까운 블록 요소 찾기
                      while (element && !['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(element.tagName)) {
                        element = element.parentElement;
                      }

                      if (element) {
                        (element as HTMLElement).style.lineHeight = lineHeight;
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

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 ${
          editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''
        }`}
      >
        <List className="w-4 h-4" />
      </button>
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
      <div className="relative">
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
          console.log('🖱️ 이미지 업로드 버튼 클릭됨');
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            console.log('📂 파일 선택됨:', file?.name, file?.type);
            if (file) {
              onImageUpload(file).then((url) => {
                console.log('🖼️ 에디터에 이미지 삽입:', url);
                editor?.chain().focus().setImage({ src: url }).run();
              }).catch(error => {
                console.error('💥 이미지 처리 실패:', error);
              });
            }
          };
          input.click();
        }}
        className="p-2 rounded hover:bg-gray-100"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
    </div>
  );
}