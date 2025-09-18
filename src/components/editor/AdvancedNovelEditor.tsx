"use client";

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import TextAlign from '@tiptap/extension-text-align';

import { toast } from 'sonner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { useRecentColors } from '@/hooks/useRecentColors';
import TableEditor from './TableEditor';
import EditorToolbar from './EditorToolbar';
import EditorStatusBar from './EditorStatusBar';
import AIDropdown from './AIDropdown';

// 코드 하이라이팅 설정
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('css', css);
lowlight.register('html', xml);

interface AdvancedNovelEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  blogId: string;
  selectedBlog?: string;
  availableBlogs?: { blogId: string, displayName: string }[];
  onBlogChange?: (blogId: string) => void;
  getDesignSettings?: (blogId: string) => Promise<any>;
  className?: string;
}

export interface AdvancedNovelEditorRef {
  chain: () => unknown | undefined;
  getHTML?: () => string;
}

const AdvancedNovelEditor = forwardRef<AdvancedNovelEditorRef, AdvancedNovelEditorProps>(({
  initialContent = "",
  onSave,
  blogId,
  selectedBlog,
  availableBlogs = [],
  onBlogChange,
  getDesignSettings,
  className
}: AdvancedNovelEditorProps, ref) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [tablePosition, setTablePosition] = useState({ x: 0, y: 0 });
  const [showTextFormattingDropdown, setShowTextFormattingDropdown] = useState(false);

  // 분리된 훅들 사용
  const { isImageUploading, handleImageUpload } = useImageUpload(blogId);
  const { recentTextColors, addRecentTextColor } = useRecentColors();

  // TipTap Editor 설정
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
        allowBase64: true,
        inline: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `제목을 입력하세요...`;
          }
          return '글을 작성해보세요...';
        },
      }),
      Typography,
      Underline,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-gray-300 p-2 bg-white',
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            borderTop: {
              default: '1px solid #ced4da',
              parseHTML: element => {
                return element.getAttribute('data-border-top') || element.style.borderTop || '1px solid #ced4da';
              },
              renderHTML: attributes => {
                if (!attributes.borderTop || attributes.borderTop === 'none') return {};
                return {
                  'data-border-top': attributes.borderTop,
                };
              },
            },
            borderBottom: {
              default: '1px solid #ced4da',
              parseHTML: element => {
                return element.getAttribute('data-border-bottom') || element.style.borderBottom || '1px solid #ced4da';
              },
              renderHTML: attributes => {
                if (!attributes.borderBottom || attributes.borderBottom === 'none') return {};
                return {
                  'data-border-bottom': attributes.borderBottom,
                };
              },
            },
            borderLeft: {
              default: '1px solid #ced4da',
              parseHTML: element => {
                return element.getAttribute('data-border-left') || element.style.borderLeft || '1px solid #ced4da';
              },
              renderHTML: attributes => {
                if (!attributes.borderLeft || attributes.borderLeft === 'none') return {};
                return {
                  'data-border-left': attributes.borderLeft,
                };
              },
            },
            borderRight: {
              default: '1px solid #ced4da',
              parseHTML: element => {
                return element.getAttribute('data-border-right') || element.style.borderRight || '1px solid #ced4da';
              },
              renderHTML: attributes => {
                if (!attributes.borderRight || attributes.borderRight === 'none') return {};
                return {
                  'data-border-right': attributes.borderRight,
                };
              },
            },
            backgroundColor: {
              default: null,
              parseHTML: element => element.getAttribute('data-background-color'),
              renderHTML: attributes => {
                if (!attributes.backgroundColor) return {};
                return {
                  'data-background-color': attributes.backgroundColor,
                };
              },
            },
          };
        },

        renderHTML({ HTMLAttributes }) {
          const style = [
            'padding: 8px',
            'min-width: 10em',
            'vertical-align: top',
            'box-sizing: border-box',
            'position: relative'
          ];

          const borderTop = HTMLAttributes['data-border-top'] || HTMLAttributes.borderTop;
          const borderBottom = HTMLAttributes['data-border-bottom'] || HTMLAttributes.borderBottom;
          const borderLeft = HTMLAttributes['data-border-left'] || HTMLAttributes.borderLeft;
          const borderRight = HTMLAttributes['data-border-right'] || HTMLAttributes.borderRight;

          if (borderTop && borderTop !== 'none') {
            style.push(`border-top: ${borderTop} !important`);
          } else {
            style.push('border-top: none !important');
          }
          if (borderBottom && borderBottom !== 'none') {
            style.push(`border-bottom: ${borderBottom} !important`);
          } else {
            style.push('border-bottom: none !important');
          }
          if (borderLeft && borderLeft !== 'none') {
            style.push(`border-left: ${borderLeft} !important`);
          } else {
            style.push('border-left: none !important');
          }
          if (borderRight && borderRight !== 'none') {
            style.push(`border-right: ${borderRight} !important`);
          } else {
            style.push('border-right: none !important');
          }

          const backgroundColor = HTMLAttributes['data-background-color'] || HTMLAttributes.backgroundColor;
          if (backgroundColor) {
            style.push(`background-color: ${backgroundColor}`);
          }

          return [
            'td',
            {
              ...HTMLAttributes,
              style: style.join('; ')
            },
            0
          ];
        },
      }),
      Youtube.configure({
        width: 640,
        height: 480,
        allowFullscreen: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'div'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
    ],
    content: initialContent || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none',
        spellcheck: 'false',
      },
      handleDrop: (view, event, slice, moved) => {
        const files = Array.from(event.dataTransfer?.files || []);

        if (files.length > 0 && files[0].type.startsWith('image/')) {
          event.preventDefault();

          handleImageUpload(files[0]).then((url) => {
            const { schema } = view.state;
            const pos = view.posAtCoords({
              left: event.clientX,
              top: event.clientY
            });

            if (pos) {
              const imageNode = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.insert(pos.pos, imageNode);
              view.dispatch(transaction);
            }
          }).catch(error => {
            console.error('❌ 이미지 업로드 실패:', error);
          });
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files || []);
        if (files.length > 0 && files[0].type.startsWith('image/')) {
          event.preventDefault();

          handleImageUpload(files[0]).then((url) => {
            const { schema } = view.state;
            const imageNode = schema.nodes.image.create({ src: url });
            const transaction = view.state.tr.replaceSelectionWith(imageNode);
            view.dispatch(transaction);
          });
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  // AI 기능 (editor 정의 후)
  const {
    showAICompletion,
    showAIDropdown,
    setShowAIDropdown,
    selectedText,
    aiCommand,
    setAiCommand,
    aiMode,
    handleFullContentAI,
    handleSelectedTextAI,
    handleAIButtonClick
  } = useAIFeatures(editor, selectedBlog, getDesignSettings);

  // initialContent 변경 시 에디터 내용 업데이트
  useEffect(() => {
    if (initialContent && initialContent !== content && editor && !showAICompletion) {
      setContent(initialContent);
      editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor, showAICompletion]);

  // 자동 저장
  useEffect(() => {
    if (!content || !onSave || !editor) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      onSave(content);
      setTimeout(() => setIsSaving(false), 1000);
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, onSave, editor]);

  // Ref 노출
  useImperativeHandle(ref, () => ({
    chain: () => editor?.chain(),
    getHTML: () => editor?.getHTML() || ''
  }), [editor]);

  // 드롭다운 자동 닫기 (외부 클릭 감지) - editor 정의 후
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 표 드롭다운 외부 클릭 시 닫기
      if (showTableDropdown && !target.closest('.table-dropdown-container')) {
        setShowTableDropdown(false);
      }

      // 표 편집 패널 외부 클릭 시 닫기
      if (showTableEditor && !target.closest('.table-editor-panel') && !target.closest('table')) {
        setShowTableEditor(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTableDropdown, showTableEditor]);

  // 표 생성 함수
  const handleCreateTable = useCallback(() => {
    if (!editor) {
      console.error('❌ 표 생성 실패: 에디터가 없음');
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    console.log('📊 표 생성 시작:', { rows: tableRows, cols: tableCols });

    try {
      const result = editor
        .chain()
        .focus()
        .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: false })
        .run();

      console.log('✅ 표 생성 결과:', result);

      if (result) {
        setShowTableDropdown(false);
        toast.success(`${tableRows}×${tableCols} 표가 생성되었습니다!`);
      } else {
        console.warn('⚠️ 표 생성 명령이 실행되지 않음');
        toast.warning('표 생성에 실패했습니다. 커서 위치를 확인해주세요.');
      }
    } catch (error) {
      console.error('❌ 표 생성 중 에러:', error);
      toast.error('표 생성 중 오류가 발생했습니다.');
    }
  }, [editor, tableRows, tableCols]);

  // 표 클릭 감지 및 편집 패널 표시
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (target.closest('table')) {
        const table = target.closest('table');
        if (table) {
          const rect = table.getBoundingClientRect();
          setTablePosition({
            x: rect.right + 10,
            y: rect.top
          });
          setShowTableEditor(true);
        }
      } else if (!target.closest('.table-editor-panel')) {
        setShowTableEditor(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [editor]);

  // 블로그 선택 시 폰트 자동 변경
  useEffect(() => {
    const updateEditorFont = async () => {
      if (!selectedBlog || !getDesignSettings || content.trim()) {
        return;
      }

      try {
        const settings = await getDesignSettings(selectedBlog);
        if (settings?.design?.fontFamily) {
          const editorElement = document.querySelector('.ProseMirror');
          if (editorElement) {
            (editorElement as HTMLElement).style.fontFamily = settings.design.fontFamily;
          }
        }
      } catch (error) {
        console.warn('폰트 자동 변경 실패:', error);
      }
    };

    updateEditorFont();
  }, [selectedBlog, getDesignSettings, content]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="text-gray-600">에디터 로딩 중...</span>
      </div>
    );
  }

  const wordCount = editor?.getText().split(' ').filter(word => word.length > 0).length || 0;

  return (
    <div className={`w-full ${className}`}>
      {/* 상태 표시 바 */}
      <EditorStatusBar
        isSaving={isSaving}
        isImageUploading={isImageUploading}
        showAICompletion={showAICompletion}
        wordCount={wordCount}
      />

      {/* 메인 에디터 */}
      <div className="relative border rounded-lg bg-white">
        {/* 편집 툴바 */}
        <EditorToolbar
          editor={editor}
          showTableDropdown={showTableDropdown}
          setShowTableDropdown={setShowTableDropdown}
          tableRows={tableRows}
          setTableRows={setTableRows}
          tableCols={tableCols}
          setTableCols={setTableCols}
          onCreateTable={handleCreateTable}
          onImageUpload={handleImageUpload}
          onAIButtonClick={handleAIButtonClick}
          showTextFormattingDropdown={showTextFormattingDropdown}
          onTextFormattingClick={() => setShowTextFormattingDropdown(!showTextFormattingDropdown)}
          showAICompletion={showAICompletion}
        />

        {/* AI 드롭다운 */}
        <AIDropdown
          showAIDropdown={showAIDropdown}
          setShowAIDropdown={setShowAIDropdown}
          aiMode={aiMode}
          selectedText={selectedText}
          aiCommand={aiCommand}
          setAiCommand={setAiCommand}
          selectedBlog={selectedBlog}
          availableBlogs={availableBlogs}
          onBlogChange={onBlogChange}
          onSelectedTextAI={handleSelectedTextAI}
          onFullContentAI={handleFullContentAI}
          showAICompletion={showAICompletion}
          editor={editor}
        />

        <EditorContent
          editor={editor}
          className="min-h-[600px] p-6 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        />
      </div>

      {/* 테이블 편집 패널 */}
      <TableEditor
        editor={editor}
        isVisible={showTableEditor}
        position={tablePosition}
        onClose={() => setShowTableEditor(false)}
      />


      {/* AI 도움말 */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
          <span>
            <strong>AI 버튼</strong>: 텍스트 선택 → 리라이팅 | 미선택 → 본문 보강
          </span>
        </div>
      </div>

    </div>
  );
});

AdvancedNovelEditor.displayName = 'AdvancedNovelEditor';

export default AdvancedNovelEditor;