"use client";

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  TableIcon,
  ImageIcon,
  Type,
  Highlighter,
  Sparkles,
  Smile,
  Hash,
  Quote,
  Minus,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import CustomEmojiPicker from '../ui/EmojiPicker';
import PollConfigModal from '../modals/PollConfigModal';
import ChartDialog from '../modals/ChartDialog';

// 드롭다운 컴포넌트들
import TextFormattingDropdown from '../dropdown/TextFormattingDropdown';
import ColorDropdown from '../dropdown/ColorDropdown';
import TableDropdown from '../dropdown/TableDropdown';
import SymbolDropdown from '../dropdown/SymbolDropdown';
import QuoteStyleDropdown from '../dropdown/QuoteStyleDropdown';
import DividerDropdown from '../dropdown/DividerDropdown';
import MarketWidgetDropdown from '../dropdown/MarketWidgetDropdown';

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
  const [showTextColorDropdown, setShowTextColorDropdown] = useState(false);
  const [showBgColorDropdown, setShowBgColorDropdown] = useState(false);

  // 에디터 상태 업데이트를 위한 state (리렌더링 트리거)
  const [, setEditorUpdate] = useState(0);

  // 에디터 상태 변경 감지 (굵기, 기울임, 밑줄 버튼 즉시 반영)
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setEditorUpdate(prev => prev + 1);
    };

    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  // 외부 클릭 감지로 드롭다운 자동 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (showTextFormattingDropdown && !target.closest('.text-formatting-container')) {
        onTextFormattingClick();
      }

      if (showTableDropdown && !target.closest('.table-dropdown-container')) {
        setShowTableDropdown(false);
      }

      if (showEmojiPicker && !target.closest('.emoji-dropdown-container')) {
        setShowEmojiPicker(false);
      }

      if (showSymbolDropdown && !target.closest('.symbol-dropdown-container')) {
        setShowSymbolDropdown(false);
      }

      if (showQuoteStyleDropdown && !target.closest('.quote-style-dropdown-container')) {
        setShowQuoteStyleDropdown(false);
      }

      if (showDividerDropdown && !target.closest('.divider-dropdown-container')) {
        setShowDividerDropdown(false);
      }

      if (showMarketWidgetDropdown && !target.closest('.market-widget-dropdown-container')) {
        setShowMarketWidgetDropdown(false);
      }

      if (showTextColorDropdown && !target.closest('.text-color-dropdown-container')) {
        setShowTextColorDropdown(false);
      }

      if (showBgColorDropdown && !target.closest('.bg-color-dropdown-container')) {
        setShowBgColorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [
    showTextFormattingDropdown,
    onTextFormattingClick,
    showTableDropdown,
    showEmojiPicker,
    showSymbolDropdown,
    showQuoteStyleDropdown,
    showDividerDropdown,
    showMarketWidgetDropdown,
    showPollModal,
    showAICompletion,
    onAIButtonClick,
    showTextColorDropdown,
    showBgColorDropdown
  ]);

  // 세션 색상을 최근 색상으로 업데이트 (실시간)
  useEffect(() => {
    setRecentColors(currentSessionColors.slice(-6).reverse());
  }, [currentSessionColors]);

  useEffect(() => {
    setRecentBgColors(currentSessionBgColors.slice(-6).reverse());
  }, [currentSessionBgColors]);

  // 세션 중 색상 추가 함수 (메모리에만 저장)
  const addSessionColor = (color: string) => {
    setCurrentSessionColors(prev =>
      prev.includes(color) ? prev : [...prev, color]
    );
  };

  const addSessionBgColor = (color: string) => {
    setCurrentSessionBgColors(prev =>
      prev.includes(color) ? prev : [...prev, color]
    );
  };

  return (
    <div className="p-2 flex items-center gap-1 bg-gray-50">
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

      {/* 텍스트 포매팅 (폰트 크기, 정렬) */}
      <div className="relative text-formatting-container">
        <button
          onClick={onTextFormattingClick}
          className="p-2 rounded hover:bg-gray-100 border border-gray-200"
          title="텍스트 포매팅 (크기, 정렬)"
        >
          <span className="text-xs text-gray-700 font-semibold w-4 h-4 flex items-center justify-center">
            {(() => {
              const fontSize = editor?.getAttributes('textStyle')?.fontSize;
              if (fontSize) {
                return fontSize.replace('px', '');
              }
              return '16';
            })()}
          </span>
        </button>

        <TextFormattingDropdown
          editor={editor}
          isOpen={showTextFormattingDropdown}
        />
      </div>

      {/* 글자색 버튼 */}
      <div className="relative text-color-dropdown-container">
        <button
          onClick={() => setShowTextColorDropdown(!showTextColorDropdown)}
          className="p-2 rounded hover:bg-gray-100 border border-gray-200"
          title="글자색"
        >
          <Type className="w-4 h-4" />
        </button>

        <ColorDropdown
          type="text"
          editor={editor}
          isOpen={showTextColorDropdown}
          recentColors={recentColors}
          onAddColor={addSessionColor}
        />
      </div>

      {/* 배경색 버튼 */}
      <div className="relative bg-color-dropdown-container">
        <button
          onClick={() => setShowBgColorDropdown(!showBgColorDropdown)}
          className="p-2 rounded hover:bg-gray-100 border border-gray-200"
          title="배경색 (하이라이트)"
        >
          <Highlighter className="w-4 h-4" />
        </button>

        <ColorDropdown
          type="background"
          editor={editor}
          isOpen={showBgColorDropdown}
          recentColors={recentBgColors}
          onAddColor={addSessionBgColor}
        />
      </div>

      {/* Bold 버튼 */}
      <button
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={`p-2 rounded border ${
          editor?.isActive('bold')
            ? 'bg-blue-500 text-white border-blue-600'
            : 'border-gray-200 hover:bg-gray-100'
        }`}
        title="굵게 (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      {/* Italic 버튼 */}
      <button
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={`p-2 rounded border ${
          editor?.isActive('italic')
            ? 'bg-blue-500 text-white border-blue-600'
            : 'border-gray-200 hover:bg-gray-100'
        }`}
        title="기울임 (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Underline 버튼 */}
      <button
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded border ${
          editor?.isActive('underline')
            ? 'bg-blue-500 text-white border-blue-600'
            : 'border-gray-200 hover:bg-gray-100'
        }`}
        title="밑줄 (Ctrl+U)"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 이모지 선택기 */}
      <div className="relative emoji-dropdown-container">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded hover:bg-gray-100 border border-gray-200"
          title="이모지 삽입"
        >
          <Smile className="w-4 h-4" />
        </button>

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

        <SymbolDropdown
          editor={editor}
          isOpen={showSymbolDropdown}
          onClose={() => setShowSymbolDropdown(false)}
        />
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

        <QuoteStyleDropdown
          editor={editor}
          isOpen={showQuoteStyleDropdown}
          onClose={() => setShowQuoteStyleDropdown(false)}
        />
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

        <DividerDropdown
          editor={editor}
          isOpen={showDividerDropdown}
          onClose={() => setShowDividerDropdown(false)}
        />
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* 표 생성 */}
      <div className="relative table-dropdown-container">
        <button
          onClick={() => setShowTableDropdown(!showTableDropdown)}
          className="p-2 rounded hover:bg-gray-100"
          title="테이블 삽입"
        >
          <TableIcon className="w-4 h-4" />
        </button>

        <TableDropdown
          isOpen={showTableDropdown}
          tableRows={tableRows}
          tableCols={tableCols}
          onRowsChange={setTableRows}
          onColsChange={setTableCols}
          onCreateTable={onCreateTable}
          onClose={() => setShowTableDropdown(false)}
        />
      </div>

      {/* 이미지 업로드 */}
      <button
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true;
          input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                  const url = await onImageUpload(file);
                  // XSS 방지: TipTap 노드 API 사용
                  editor?.chain()
                    .focus()
                    .setImage({ src: url })
                    .createParagraphNear()
                    .run();
                } catch (error) {
                  // 이미지 업로드 실패
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

        <MarketWidgetDropdown
          editor={editor}
          isOpen={showMarketWidgetDropdown}
          onClose={() => setShowMarketWidgetDropdown(false)}
        />
      </div>

      {/* 투표/설문조사 */}
      <button
        onClick={() => setShowPollModal(true)}
        className="p-2 rounded hover:bg-gray-100"
        title="투표/설문조사 삽입"
      >
        <BarChart3 className="w-4 h-4" />
      </button>

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

      <ChartDialog
        isOpen={showChartDialog}
        onClose={() => setShowChartDialog(false)}
        onInsert={(chartType, data, title, units, colors) => {
          if (editor) {
            (editor as any).chain().focus().insertChart({ chartType, data, title, units, colors }).run();
          }
        }}
      />
    </div>
  );
}
