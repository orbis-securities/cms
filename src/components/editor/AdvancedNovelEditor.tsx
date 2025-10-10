"use client";

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
import { ResizableImage } from './extensions/ResizableImage';
import { CustomBlockquote } from './extensions/CustomBlockquote';
import { CustomHorizontalRule } from './extensions/CustomHorizontalRule';
import { DividerToolbarPortal } from './DividerToolbarPortal';
import { SlashCommand, getSuggestionItems, renderItems } from './extensions/SlashCommand';

import { toast } from 'sonner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { useRecentColors } from '@/hooks/useRecentColors';
import TableEditor from './TableEditor';
import EditorToolbar from './EditorToolbar';
import EditorStatusBar from './EditorStatusBar';
import AIDropdown from './AIDropdown';
import SpellCheckPanel from './SpellCheckPanel';
import ImageToolbar from './ImageToolbar';
import BlockquoteToolbar from './BlockquoteToolbar';

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
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [htmlContent, setHtmlContent] = useState('');
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSpellCheck, setShowSpellCheck] = useState(false);
  const [showImageToolbar, setShowImageToolbar] = useState(false);
  const [imageToolbarPosition, setImageToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedImageNode, setSelectedImageNode] = useState<any>(null);
  const [currentImageAlignment, setCurrentImageAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [showBlockquoteToolbar, setShowBlockquoteToolbar] = useState(false);
  const [blockquoteToolbarPosition, setBlockquoteToolbarPosition] = useState({ x: 0, y: 0 });
  const [currentBlockquoteAlignment, setCurrentBlockquoteAlignment] = useState<'left' | 'center' | 'right'>('center');

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
        blockquote: false, // 기본 blockquote 비활성화
        horizontalRule: false, // 기본 horizontalRule 비활성화
      }),
      CustomBlockquote,
      CustomHorizontalRule,
      ResizableImage.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto cursor-pointer',
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
      SlashCommand.configure({
        suggestion: {
          items: ({ query, editor }: { query: string; editor: any }) => getSuggestionItems({
            query,
            editor,
            onImageUpload: handleImageUpload,
            onAIButtonClick: handleAIButtonClick,
          }),
          render: renderItems,
        },
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
              const imageNode = schema.nodes.resizableImage.create({
                src: url,
                width: 400
              });
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
            const imageNode = schema.nodes.resizableImage.create({
              src: url,
              width: 400
            });
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
    onSelectionUpdate: ({ editor }) => {
      // 선택 변경 시 이미지가 선택되었는지 확인
      const { state } = editor;
      const { selection } = state;
      const { from, to } = selection;

      // 선택된 노드가 이미지인지 확인
      state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.type.name === 'resizableImage') {
          // DOM에서 실제 이미지 엘리먼트 찾기
          setTimeout(() => {
            const editorElement = document.querySelector('.ProseMirror');
            const images = editorElement?.querySelectorAll('img');
            if (images) {
              for (const img of Array.from(images)) {
                if (img.src === node.attrs.src) {
                  const rect = img.getBoundingClientRect();
                  setImageToolbarPosition({
                    x: rect.right + 10,
                    y: rect.top
                  });
                  setSelectedImageNode(img);
                  setShowImageToolbar(true);
                  break;
                }
              }
            }
          }, 100);
          return false; // 첫 번째 이미지만 처리
        }
      });
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

      // AI 드롭다운 외부 클릭 시 닫기
      if (showAIDropdown && !target.closest('.ai-dropdown-container') && !target.closest('.ai-button-container')) {
        setShowAIDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTableDropdown, showTableEditor, showAIDropdown]);

  // 표 생성 함수
  const handleCreateTable = useCallback(() => {
    if (!editor) {
      console.error('❌ 표 생성 실패: 에디터가 없음');
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      const result = editor
        .chain()
        .focus()
        .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: false })
        .run();

      if (result) {
        setShowTableDropdown(false);
      } else {
        toast.warning('표 생성에 실패했습니다. 커서 위치를 확인해주세요.');
      }
    } catch (error) {
      toast.error('표 생성 중 오류가 발생했습니다.');
    }
  }, [editor, tableRows, tableCols]);

  // 표 클릭 감지 및 편집 패널 표시
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 이미지 클릭 감지
      if (target.tagName === 'IMG' || target.closest('img')) {
        const img = target.tagName === 'IMG' ? target as HTMLImageElement : target.closest('img') as HTMLImageElement;
        if (img) {
          console.log('🖼️ 이미지 클릭 감지:', img.src);
          const rect = img.getBoundingClientRect();
          setImageToolbarPosition({
            x: rect.right + 10,
            y: rect.top
          });
          setSelectedImageNode(img);

          // 현재 정렬 상태 감지
          const parentElement = img.parentElement;
          const alignAttr = parentElement?.getAttribute('data-align') || 'left';
          setCurrentImageAlignment(alignAttr as 'left' | 'center' | 'right');

          setShowImageToolbar(true);
          setShowTableEditor(false);
          console.log('✅ 이미지 툴바 표시 설정 완료');
        }
      }
      // 테이블 클릭 감지
      else if (target.closest('table')) {
        const table = target.closest('table');
        if (table) {
          const rect = table.getBoundingClientRect();
          setTablePosition({
            x: rect.right + 10,
            y: rect.top
          });
          setShowTableEditor(true);
          setShowImageToolbar(false); // 이미지 툴바는 닫기
          setShowBlockquoteToolbar(false); // 인용구 툴바는 닫기
        }
      }
      // 인용구 클릭 감지
      else if (target.closest('blockquote')) {
        const blockquote = target.closest('blockquote');
        if (blockquote) {
          const rect = blockquote.getBoundingClientRect();
          setBlockquoteToolbarPosition({
            x: rect.right + 10,
            y: rect.top
          });

          // 현재 정렬 상태 감지
          const alignAttr = blockquote.getAttribute('data-align') || 'center';
          setCurrentBlockquoteAlignment(alignAttr as 'left' | 'center' | 'right');

          setShowBlockquoteToolbar(true);
          setShowTableEditor(false);
          setShowImageToolbar(false);
        }
      }
      // 외부 클릭 시 모든 툴바 닫기
      else if (!target.closest('.table-editor-panel') && !target.closest('.image-toolbar-panel') && !target.closest('.blockquote-toolbar-panel')) {
        setShowTableEditor(false);
        setShowImageToolbar(false);
        setShowBlockquoteToolbar(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [editor]);

  // 에디터 모드 변경 시 HTML 동기화
  useEffect(() => {
    if (editor) {
      if (editorMode === 'html') {
        // 비주얼 → HTML: 현재 에디터 내용을 HTML로 변환
        setHtmlContent(editor.getHTML());
      } else {
        // HTML → 비주얼: HTML 내용을 에디터에 적용
        if (htmlContent && htmlContent !== editor.getHTML()) {
          editor.commands.setContent(htmlContent);
        }
      }
    }
  }, [editorMode, editor]);

  // HTML 내용 변경 시 실시간 업데이트
  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    setContent(value); // 상위 컴포넌트에도 반영
  };

  // AI 요약 생성 함수
  const handleGenerateSummary = async () => {
    if (!content.trim()) return;

    setIsGeneratingSummary(true);
    try {
      // HTML 태그 제거하여 순수 텍스트만 추출
      const textContent = content.replace(/<[^>]*>/g, '').trim();

      if (!textContent) {
        setSummary('내용이 없어 요약할 수 없습니다.');
        return;
      }

      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent,
          command: '다음 텍스트를 1-2줄로 간결하게 요약해주세요. 핵심 내용만 포함하고 한국어로 작성해주세요.',
          context: `블로그 ID: ${selectedBlog || 'default'}, 요약 생성`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // HTML 태그 제거 후 요약 결과 설정
        const cleanSummary = data.enhanced?.replace(/<[^>]*>/g, '').trim() || '요약을 생성할 수 없습니다.';
        setSummary(cleanSummary);
      } else {
        throw new Error(data.error || 'AI 요약 생성 실패');
      }
    } catch (error) {
      console.error('❌ AI 요약 생성 오류:', error);
      setSummary('요약 생성에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // 맞춤법 수정 적용 함수
  const handleApplySpellFix = (original: string, suggestion: string) => {
    if (!editor) return;

    try {
      // 현재 에디터의 HTML 내용 가져오기
      const currentHTML = editor.getHTML();

      // HTML에서 텍스트 노드만 찾아서 교체
      const updatedHTML = currentHTML.replace(
        new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        suggestion
      );

      // 에디터에 수정된 내용 적용
      editor.commands.setContent(updatedHTML);

      // 내용 상태도 업데이트
      setContent(updatedHTML);

      toast.success(`"${original}" → "${suggestion}" 수정 완료!`);
    } catch (error) {
      console.error('❌ 맞춤법 수정 적용 실패:', error);
      toast.error('수정 적용에 실패했습니다.');
    }
  };

  // 이미지 툴바 핸들러들
  const handleImageDelete = () => {
    if (!editor || !selectedImageNode) return;

    try {
      // 현재 선택된 이미지 노드 찾기
      const { state } = editor;
      const { selection } = state;

      // 이미지 삭제
      editor.chain().focus().deleteSelection().run();

      setShowImageToolbar(false);
      setSelectedImageNode(null);
      toast.success('이미지가 삭제되었습니다.');
    } catch (error) {
      console.error('❌ 이미지 삭제 실패:', error);
      toast.error('이미지 삭제에 실패했습니다.');
    }
  };

  const handleImageAlign = (alignment: 'left' | 'center' | 'right') => {
    if (!editor || !selectedImageNode) return;

    try {
      const currentSrc = selectedImageNode.src;
      const { state } = editor;
      let imagePos = -1;

      // 에디터에서 이미지 노드의 위치 찾기
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'resizableImage' && node.attrs.src === currentSrc) {
          imagePos = pos;
          return false;
        }
      });

      if (imagePos !== -1) {
        const currentNode = state.doc.nodeAt(imagePos);

        // 이미지 노드에 align 속성 업데이트
        const tr = state.tr.setNodeMarkup(imagePos, undefined, {
          ...currentNode?.attrs,
          align: alignment
        });
        editor.view.dispatch(tr);

        // DOM 즉시 업데이트
        setTimeout(() => {
          const container = selectedImageNode.closest('.image-resizer-container');
          if (container) {
            // 기존 정렬 클래스 제거
            container.classList.remove('image-align-left', 'image-align-center', 'image-align-right');
            // 새 정렬 클래스 추가
            container.classList.add(`image-align-${alignment}`);
            container.setAttribute('data-align', alignment);
          }
        }, 0);

        // 정렬 상태 업데이트
        setCurrentImageAlignment(alignment);
      }
    } catch (error) {
    }
  };

  const handleImageResize = (width: number) => {
    if (!editor || !selectedImageNode) return;

    try {
      const currentSrc = selectedImageNode.src;
      const { state } = editor;
      let imagePos = -1;

      // 에디터에서 이미지 노드의 위치 찾기
      state.doc.descendants((node, pos) => {
        if (node.type.name === 'resizableImage' && node.attrs.src === currentSrc) {
          imagePos = pos;
          return false;
        }
      });

      if (imagePos !== -1) {
        // 이미지 속성만 업데이트 (새로운 이미지 추가하지 않음)
        const tr = state.tr.setNodeMarkup(imagePos, undefined, {
          ...state.doc.nodeAt(imagePos)?.attrs,
          width: width
        });
        editor.view.dispatch(tr);

        // DOM에서도 즉시 반영
        selectedImageNode.style.width = `${width}px`;
        selectedImageNode.style.height = 'auto';
      }
    } catch (error) {
    }
  };

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

        {/* 에디터 모드 탭 */}
        <div className="border-b bg-gray-50 px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setEditorMode('visual')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                editorMode === 'visual'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              비주얼
            </button>
            <button
              onClick={() => setEditorMode('html')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                editorMode === 'html'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              HTML
            </button>
          </div>
        </div>

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

        {/* 에디터 영역 */}
        {editorMode === 'visual' ? (
          <EditorContent
            editor={editor}
            className="min-h-[600px] p-6 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
          />
        ) : (
          <div className="min-h-[600px] p-0">
            <textarea
              value={htmlContent}
              onChange={(e) => handleHtmlChange(e.target.value)}
              className="w-full h-[600px] p-4 font-mono text-sm border-none outline-none resize-none focus:ring-0"
              placeholder="HTML 코드를 직접 편집하세요..."
              style={{
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", consolas, "source-code-pro", monospace',
                lineHeight: '1.5',
                tabSize: 2
              }}
            />
          </div>
        )}
      </div>

      {/* 구분선 툴바 */}
      {editor && <DividerToolbarPortal editor={editor} />}

      {/* 테이블 편집 패널 */}
      <TableEditor
        editor={editor}
        isVisible={showTableEditor}
        position={tablePosition}
        onClose={() => setShowTableEditor(false)}
      />

      {/* 이미지 편집 툴바 */}
      <ImageToolbar
        isVisible={showImageToolbar}
        position={imageToolbarPosition}
        onDelete={handleImageDelete}
        onAlign={handleImageAlign}
        onResize={handleImageResize}
        currentWidth={selectedImageNode?.width || 400}
        currentAlignment={currentImageAlignment}
      />

      {/* 인용구 편집 툴바 */}
      {showBlockquoteToolbar && editor && (
        <div className="blockquote-toolbar-panel">
          <BlockquoteToolbar
            editor={editor}
            position={blockquoteToolbarPosition}
            onClose={() => setShowBlockquoteToolbar(false)}
            currentAlign={currentBlockquoteAlignment}
          />
        </div>
      )}

      {/* AI 요약 기능 */}
      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-medium text-gray-700">📝 AI 요약</h4>
          <button
            onClick={handleGenerateSummary}
            disabled={!content.trim() || isGeneratingSummary}
            className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
          >
            {isGeneratingSummary ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                요약 중...
              </>
            ) : (
              '요약하기'
            )}
          </button>
          <button
            onClick={() => setShowSpellCheck(true)}
            disabled={!content.trim()}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
          >
            🔤 맞춤법
          </button>
          <div className="flex-1">
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="본문 내용의 1-2줄 요약이 여기에 생성됩니다..."
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly={isGeneratingSummary}
            />
          </div>
        </div>
      </div>

      {/* AI 도움말 */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
          <span>
            <strong>AI 버튼</strong>: 텍스트 선택 → 리라이팅 | 미선택 → 본문 보강
          </span>
        </div>
      </div>

      {/* 맞춤법 검사 패널 */}
      <SpellCheckPanel
        isOpen={showSpellCheck}
        onClose={() => setShowSpellCheck(false)}
        content={content}
        onApplyFix={handleApplySpellFix}
      />

    </div>
  );
});

AdvancedNovelEditor.displayName = 'AdvancedNovelEditor';

export default AdvancedNovelEditor;