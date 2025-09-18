"use client";

import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Node } from '@tiptap/core';
import { mergeAttributes, nodeInputRule } from '@tiptap/core';
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

import { toast } from 'sonner';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import TableEditor from './TableEditor';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  Table as TableIcon,
  Type,
  Palette,
  Sparkles,
  Loader2,
  Settings
} from 'lucide-react';

// Gemini AI 자동완성 확장
const AIAutoComplete = Extension.create({
  name: 'aiAutoComplete',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('aiAutoComplete'),
        props: {
          handleKeyDown: (view, event) => {
            // '/' 키를 감지
            if (event.key === '/') {
              const { state } = view;
              const { selection } = state;
              const { from } = selection;
              
              // 현재 텍스트 가져오기
              const textBefore = state.doc.textBetween(Math.max(0, from - 100), from);
              
              // AI 자동완성 트리거
              setTimeout(() => {
                triggerAICompletion(textBefore, view);
              }, 100);
              
              return false;
            }
            return false;
          },
        },
      }),
    ];
  },
});

// AI 자동완성 함수
const triggerAICompletion = async (context: string, view: any) => {
  try {
    toast.loading('AI가 텍스트를 생성하고 있습니다...', { id: 'ai-completion' });
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: context,
        context: 'Blog post writing',
      }),
    });

    const data = await response.json();
    
    if (data.success && data.completion) {
      // AI 생성 텍스트를 에디터에 삽입
      const { state, dispatch } = view;
      const { selection } = state;
      const { from } = selection;
      
      const transaction = state.tr.insertText(data.completion, from);
      dispatch(transaction);
      
      toast.success('AI 텍스트가 생성되었습니다!', { id: 'ai-completion' });
    } else {
      throw new Error(data.error || 'AI 생성 실패');
    }
  } catch (error) {
    console.error('AI 자동완성 오류:', error);
    toast.error('AI 자동완성을 사용할 수 없습니다.', { id: 'ai-completion' });
  }
};

// 코드 하이라이팅 언어 설정
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
  getHTML: () => string;
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
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [currentFont, setCurrentFont] = useState('Pretendard');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [tablePosition, setTablePosition] = useState({ x: 0, y: 0 });

  // 분리된 훅들 사용
  const { isImageUploading, handleImageUpload: hookImageUpload } = useImageUpload(blogId);
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

  // 새로운 테두리 시스템 상태
  const [borderSelection, setBorderSelection] = useState<'all' | 'top' | 'bottom' | 'left' | 'right'>('all');
  const [borderStyle, setBorderStyle] = useState<'solid' | 'none' | 'dotted' | 'double'>('solid');
  const [borderWidth, setBorderWidth] = useState<'1px' | '2px' | '3px' | '4px'>('1px');
  const [borderColor, setBorderColor] = useState('#374151');

  // 최근 사용한 색상 관리
  const [recentBorderColors, setRecentBorderColors] = useState<string[]>([]);
  const [recentBgColors, setRecentBgColors] = useState<string[]>([]);

  // 테두리 적용 순서 관리 (마지막 적용된 것이 우선)
  const [borderApplicationOrder, setBorderApplicationOrder] = useState<number>(0);

  // 테두리 색상 사용 시 최근 목록에 추가
  const addToRecentBorderColors = useCallback((color: string) => {
    setRecentBorderColors(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 12);
    });
  }, []);

  // 배경 색상 사용 시 최근 목록에 추가
  const addToRecentBgColors = useCallback((color: string) => {
    setRecentBgColors(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 12);
    });
  }, []);


  // 새로운 테두리 시스템 함수들
  // 임시 빈 함수 - editor 정의 후 실제 구현
  const getSelectedCells = useCallback((): HTMLElement[] => {
    // editor 정의 후에 실제 구현됩니다
    return [];
  }, []);

  const getCurrentCell = useCallback((): HTMLElement | null => {
    const proseMirror = document.querySelector('.ProseMirror');
    const focusedElement = proseMirror?.querySelector('.ProseMirror-focused');
    return focusedElement?.closest('td, th') as HTMLElement || null;
  }, []);

  const createBorderStyle = useCallback((width: string, style: string, color: string) => {
    return `${width} ${style} ${color}`;
  }, []);

  const applyBorderToCell = useCallback((sides: string[], borderStyleStr: string) => {
    sides.forEach(side => {
      const attributeName = `border${side.charAt(0).toUpperCase() + side.slice(1)}`;
      // editor는 나중에 정의되므로 직접 참조하지 않고 함수 실행 시점에 체크
    });
  }, []);

  const removeBorderFromCell = useCallback((sides: string[]) => {
    sides.forEach(side => {
      const attributeName = `border${side.charAt(0).toUpperCase() + side.slice(1)}`;
      // editor는 나중에 정의되므로 직접 참조하지 않고 함수 실행 시점에 체크
    });
  }, []);

  const getCellPosition = useCallback((cell: HTMLElement): { row: number, col: number } => {
    const table = cell.closest('table');
    if (!table) return { row: -1, col: -1 };

    const rows = Array.from(table.querySelectorAll('tr'));
    const cellRow = cell.closest('tr');
    if (!cellRow) return { row: -1, col: -1 };

    const rowIndex = rows.indexOf(cellRow);
    const cells = Array.from(cellRow.querySelectorAll('td, th'));
    const colIndex = cells.indexOf(cell);

    return { row: rowIndex, col: colIndex };
  }, []);

  const getTableDimensions = useCallback((table: HTMLElement): { rows: number, cols: number } => {
    const firstRow = table.querySelector('tr');
    if (!firstRow) return { rows: 0, cols: 0 };

    const rows = table.querySelectorAll('tr').length;
    const cols = firstRow.querySelectorAll('td, th').length;

    return { rows, cols };
  }, []);

  const isOutsideCell = useCallback((cell: HTMLElement, selectedCells: HTMLElement[]): { top: boolean, bottom: boolean, left: boolean, right: boolean } => {
    const cellPos = getCellPosition(cell);
    const table = cell.closest('table') as HTMLElement;
    const { rows: tableRows, cols: tableCols } = getTableDimensions(table);

    // 선택된 셀들의 위치 정보 수집
    const selectedPositions = selectedCells.map(c => getCellPosition(c));
    const minRow = Math.min(...selectedPositions.map(p => p.row));
    const maxRow = Math.max(...selectedPositions.map(p => p.row));
    const minCol = Math.min(...selectedPositions.map(p => p.col));
    const maxCol = Math.max(...selectedPositions.map(p => p.col));

    return {
      top: cellPos.row === minRow,
      bottom: cellPos.row === maxRow,
      left: cellPos.col === minCol,
      right: cellPos.col === maxCol
    };
  }, [getCellPosition, getTableDimensions]);

  const applyBorderToSelection = useCallback(() => {
    // 이 함수는 editor 정의 후에 실제 로직을 구현할 예정
    toast.info('테두리 시스템이 준비 중입니다...');
  }, [borderSelection, borderWidth, borderStyle, borderColor]);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    setIsImageUploading(true);
    try {
      console.log('📁 이미지 업로드 시작:', file.name, file.type, file.size);
      
      // 이미지 압축
      const compressedFile = await compressImage(file, 1200, 0.8);
      console.log('🗜️ 이미지 압축 완료:', compressedFile.size);
      
      const url = await uploadImageToStorage(compressedFile, blogId);
      console.log('✅ Firebase 업로드 완료:', url);
      
      toast.success(`이미지 업로드 완료: ${file.name}`);
      return url;
    } catch (error) {
      console.error('❌ 이미지 업로드 에러:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`이미지 업로드 실패: ${errorMessage}`);
      throw error;
    } finally {
      setIsImageUploading(false);
    }
  }, [blogId]);

  // Gemini AI 자동완성 핸들러
  const handleAICompletion = useCallback(async (prompt: string) => {
    setShowAICompletion(true);
    try {
      console.log('🤖 Gemini AI 호출 중:', prompt.substring(0, 50) + '...');

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context: `블로그 ID: ${blogId}, 금융/투자 전문 블로그`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Gemini AI 생성 완료');
        return data.completion;
      } else {
        throw new Error(data.error || 'AI 생성 실패');
      }
    } catch (error) {
      console.error('❌ Gemini AI 자동완성 오류:', error);
      toast.error('AI 자동완성 실패');
      return '';
    } finally {
      setShowAICompletion(false);
    }
  }, [blogId]);

  // 블로그 디자인 설정을 AI 프롬프트에 포함하는 함수
  const getDesignPrompt = useCallback(async (targetBlogId: string) => {
    console.log('🎨 디자인 설정 로드 시작:', targetBlogId);

    if (!getDesignSettings || !targetBlogId) {
      console.warn('getDesignSettings 또는 targetBlogId 없음:', { getDesignSettings: !!getDesignSettings, targetBlogId });
      return '';
    }

    try {
      const settings = await getDesignSettings(targetBlogId);
      console.log('📋 로드된 설정:', settings);

      if (!settings?.design) {
        console.warn('디자인 설정 없음:', settings);
        return '';
      }

      const design = settings.design;
      const prompt = `
스타일 가이드:
- 폰트: ${design.fontFamily} 사용
- 제목: ${design.heading?.fontSize || '28px'} 크기, ${design.heading?.color || '#1F2937'} 색상으로
- 부제목: ${design.subheading?.fontSize || '22px'} 크기, ${design.subheading?.color || '#374151'} 색상으로
- 목록: ${design.list?.fontSize || '16px'} 크기로 작성
- 하이라이트: 중요 부분은 ${design.highlight?.color || '#FBBF24'} 색상으로 강조
- 톤: ${design.textTone === 'professional' ? '전문적이고 격식 있는' : design.textTone === 'casual' ? '친근하고 편안한' : '기술적이고 정확한'} 톤으로
`;
      console.log('✅ 생성된 디자인 프롬프트:', prompt);
      return prompt;
    } catch (error) {
      console.error('❌ 디자인 설정 로드 실패:', error);
      return '';
    }
  }, [getDesignSettings]);

  // 블로그 선택 시 폰트 자동 변경 (기존 글은 보존)
  useEffect(() => {
    const updateEditorFont = async () => {
      if (!selectedBlog || !getDesignSettings || content.trim()) {
        // 기존 글이 있으면 폰트 변경하지 않음
        return;
      }

      try {
        const settings = await getDesignSettings(selectedBlog);
        if (settings?.design?.fontFamily) {
          console.log('🔤 블로그 폰트 자동 변경:', selectedBlog, settings.design.fontFamily);
          setCurrentFont(settings.design.fontFamily);

          // 에디터 폰트 스타일 업데이트
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

  // TipTap Editor 설정 - 안정적인 기본 구성
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
          return '글을 작성해보세요...'; // AI 관련 텍스트 제거
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
      Table,
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
            // 개별 테두리 속성들
            borderTop: {
              default: '1px solid #ced4da', // 기본 테두리 복원
              parseHTML: element => {
                return element.getAttribute('data-border-top') || element.style.borderTop || '1px solid #ced4da';
              },
              renderHTML: attributes => {
                console.log('🔧 borderTop renderHTML:', attributes.borderTop);
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
                console.log('🔧 borderBottom renderHTML:', attributes.borderBottom);
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
                console.log('🔧 borderLeft renderHTML:', attributes.borderLeft);
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
                console.log('🔧 borderRight renderHTML:', attributes.borderRight);
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

          // data attributes에서 테두리 스타일 읽기 (우선순위: data-* > direct attribute)
          const borderTop = HTMLAttributes['data-border-top'] || HTMLAttributes.borderTop;
          const borderBottom = HTMLAttributes['data-border-bottom'] || HTMLAttributes.borderBottom;
          const borderLeft = HTMLAttributes['data-border-left'] || HTMLAttributes.borderLeft;
          const borderRight = HTMLAttributes['data-border-right'] || HTMLAttributes.borderRight;

          console.log('🎨 renderHTML 테두리 속성:', {
            borderTop,
            borderBottom,
            borderLeft,
            borderRight,
            HTMLAttributes,
            'data-border-top': HTMLAttributes['data-border-top'],
            'data-border-bottom': HTMLAttributes['data-border-bottom'],
            'data-border-left': HTMLAttributes['data-border-left'],
            'data-border-right': HTMLAttributes['data-border-right']
          });

          // 개별 테두리 스타일 적용 (설정된 것만) - !important 추가
          if (borderTop && borderTop !== 'none') {
            style.push(`border-top: ${borderTop} !important`);
            console.log('✅ borderTop 적용:', borderTop);
          } else {
            style.push('border-top: none !important');
          }
          if (borderBottom && borderBottom !== 'none') {
            style.push(`border-bottom: ${borderBottom} !important`);
            console.log('✅ borderBottom 적용:', borderBottom);
          } else {
            style.push('border-bottom: none !important');
          }
          if (borderLeft && borderLeft !== 'none') {
            style.push(`border-left: ${borderLeft} !important`);
            console.log('✅ borderLeft 적용:', borderLeft);
          } else {
            style.push('border-left: none !important');
          }
          if (borderRight && borderRight !== 'none') {
            style.push(`border-right: ${borderRight} !important`);
            console.log('✅ borderRight 적용:', borderRight);
          } else {
            style.push('border-right: none !important');
          }

          // 배경색 적용
          const backgroundColor = HTMLAttributes['data-background-color'] || HTMLAttributes.backgroundColor;
          if (backgroundColor) {
            style.push(`background-color: ${backgroundColor}`);
            console.log('✅ 배경색 적용:', backgroundColor);
          }

          console.log('✨ 최종 스타일:', style.join('; '));

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
      AIAutoComplete, // Gemini AI 확장 활성화
    ],
    content: initialContent || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none',
        spellcheck: 'false',
      },
      handleDrop: (view, event, slice, moved) => {
        console.log('📝 에디터 드롭 이벤트:', event);
        const files = Array.from(event.dataTransfer?.files || []);
        console.log('📁 에디터 드롭 파일들:', files.map(f => f.name));
        
        if (files.length > 0 && files[0].type.startsWith('image/')) {
          console.log('✅ 에디터에서 이미지 파일 확인');
          event.preventDefault();
          
          handleImageUpload(files[0]).then((url) => {
            console.log('🖼️ 에디터에 이미지 삽입:', url);
            const { schema } = view.state;
            const pos = view.posAtCoords({ 
              left: event.clientX, 
              top: event.clientY 
            });
            
            if (pos) {
              const imageNode = schema.nodes.image.create({ src: url });
              const transaction = view.state.tr.insert(pos.pos, imageNode);
              view.dispatch(transaction);
              console.log('✅ 에디터 이미지 삽입 완료');
            } else {
              console.log('❌ 에디터 위치 찾기 실패');
            }
          }).catch(error => {
            console.error('❌ 에디터 이미지 업로드 실패:', error);
          });
          return true;
        }
        console.log('❌ 에디터: 이미지 파일이 아니거나 파일 없음');
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

  // editor 정의 이후 실제 테두리 함수들 구현
  const applyActualBorderToCell = useCallback((sides: string[], borderStyleStr: string) => {
    if (!editor) {
      console.error('❌ applyActualBorderToCell: 에디터 없음');
      return;
    }

    console.log('🎨 테두리 적용 중:', { sides, borderStyleStr });

    sides.forEach(side => {
      const attributeName = `border${side.charAt(0).toUpperCase() + side.slice(1)}`;
      console.log(`🔧 속성 설정: ${attributeName} = ${borderStyleStr}`);

      try {
        const result = editor.chain().focus().setCellAttribute(attributeName, borderStyleStr).run();
        console.log(`✅ ${attributeName} 설정 결과:`, result);
      } catch (error) {
        console.error(`❌ ${attributeName} 설정 실패:`, error);
      }
    });
  }, [editor]);

  const removeActualBorderFromCell = useCallback((sides: string[]) => {
    if (!editor) {
      console.error('❌ removeActualBorderFromCell: 에디터 없음');
      return;
    }

    console.log('🗑️ 테두리 제거 중:', sides);

    sides.forEach(side => {
      const attributeName = `border${side.charAt(0).toUpperCase() + side.slice(1)}`;
      console.log(`🔧 속성 제거: ${attributeName}`);

      try {
        const result = editor.chain().focus().setCellAttribute(attributeName, 'none').run();
        console.log(`✅ ${attributeName} 제거 결과:`, result);
      } catch (error) {
        console.error(`❌ ${attributeName} 제거 실패:`, error);
      }
    });
  }, [editor]);

  // editor 정의 이후 실제 getSelectedCells 구현
  const getActualSelectedCells = useCallback((): HTMLElement[] => {
    if (!editor) return [];

    console.log('🔍 TipTap 선택 상태 분석 시작');

    // 1. TipTap editor selection 확인
    const selection = editor.state.selection;
    console.log('📍 TipTap selection:', {
      type: selection.constructor.name,
      from: selection.from,
      to: selection.to,
      empty: selection.empty
    });

    // 2. DOM에서 다양한 방법으로 선택된 셀 찾기
    const proseMirror = document.querySelector('.ProseMirror');

    // 방법 1: ProseMirror-selectednode 클래스
    const selectedByClass = proseMirror?.querySelectorAll('td.ProseMirror-selectednode, th.ProseMirror-selectednode');

    // 방법 2: selectedCell 클래스 (CSS에서 정의한 것)
    const selectedBySelectedCell = proseMirror?.querySelectorAll('td.selectedCell, th.selectedCell');

    // 방법 3: data-* 속성으로 선택된 셀
    const selectedByData = proseMirror?.querySelectorAll('td[data-selected], th[data-selected]');

    // 방법 4: 배경색이나 스타일로 선택된 것처럼 보이는 셀
    const allCells = Array.from(proseMirror?.querySelectorAll('td, th') || []);
    const selectedByStyle = allCells.filter(cell => {
      const computedStyle = getComputedStyle(cell);
      return computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
             computedStyle.backgroundColor !== 'transparent' &&
             computedStyle.backgroundColor.includes('blue'); // 선택 표시 색상
    });

    console.log('🔍 선택된 셀 검색 결과:', {
      proseMirror: !!proseMirror,
      selectedByClass: selectedByClass?.length || 0,
      selectedBySelectedCell: selectedBySelectedCell?.length || 0,
      selectedByData: selectedByData?.length || 0,
      selectedByStyle: selectedByStyle?.length || 0,
      totalCells: allCells.length
    });

    // 가장 많이 선택된 방법 사용
    let selectedCells: NodeListOf<Element> | Element[] = selectedByClass || [];

    if ((selectedBySelectedCell?.length || 0) > selectedCells.length) {
      selectedCells = selectedBySelectedCell || [];
    }
    if ((selectedByData?.length || 0) > selectedCells.length) {
      selectedCells = selectedByData || [];
    }
    if (selectedByStyle.length > selectedCells.length) {
      selectedCells = selectedByStyle;
    }

    // 선택된 셀들의 상세 정보
    const cellInfo = Array.from(selectedCells).map(cell => ({
      tagName: cell.tagName,
      textContent: cell.textContent?.substring(0, 20),
      className: cell.className,
      style: (cell as HTMLElement).style.cssText,
      row: cell.closest('tr') ? Array.from(cell.closest('table')?.querySelectorAll('tr') || []).indexOf(cell.closest('tr')!) : -1,
      col: Array.from(cell.closest('tr')?.querySelectorAll('td, th') || []).indexOf(cell)
    }));

    console.log('📋 선택된 셀 상세 정보:', cellInfo);

    // 5. TipTap table selection API 시도
    try {
      console.log('🔧 TipTap table commands 확인');

      // table selection 관련 정보 가져오기
      const isInTable = editor.isActive('table');
      const isTableCell = editor.isActive('tableCell');
      const isTableHeader = editor.isActive('tableHeader');

      console.log('📊 TipTap table 상태:', {
        isInTable,
        isTableCell,
        isTableHeader
      });

      // selection이 CellSelection인지 확인
      const selectionType = selection.constructor.name;
      console.log('📍 Selection type:', selectionType);

      if (selectionType === 'CellSelection') {
        console.log('✅ CellSelection 감지됨!');
        // CellSelection의 경우 선택된 셀들을 가져올 수 있음
        const cellSelection = selection as any;
        console.log('📋 CellSelection 정보:', {
          $anchorCell: cellSelection.$anchorCell,
          $headCell: cellSelection.$headCell,
          ranges: cellSelection.ranges
        });
      }

    } catch (error) {
      console.warn('⚠️ TipTap table API 오류:', error);
    }

    return Array.from(selectedCells) as HTMLElement[];
  }, [editor]);


  const actualApplyBorderToSelection = useCallback(() => {
    console.log('🎯🎯🎯 actualApplyBorderToSelection 함수 실행됨! 🎯🎯🎯');
    console.log('📊 현재 설정:', { borderSelection, borderWidth, borderStyle, borderColor });

    // 테두리 색상을 최근 사용 목록에 추가
    addToRecentBorderColors(borderColor);

    // 적용 순서 증가 (마지막 적용이 우선)
    const currentOrder = borderApplicationOrder + 1;
    setBorderApplicationOrder(currentOrder);

    if (!editor) {
      console.error('❌ 에디터가 없음');
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    console.log('✅ 에디터 존재 확인');

    // 현재 선택 상태 디버깅
    const isTableCell = editor.isActive('tableCell');
    const isTableHeader = editor.isActive('tableHeader');
    console.log('📊 셀 선택 상태:', { isTableCell, isTableHeader });

    // 선택된 노드 정보
    const selection = editor.state.selection;
    console.log('📍 현재 선택:', selection);

    // DOM 레벨에서 셀 확인
    const focusedElement = document.activeElement;
    const cellElement = focusedElement?.closest('td, th');
    console.log('🔍 DOM 셀 요소:', cellElement);

    // TipTap에서 현재 선택된 셀 확인
    if (!isTableCell && !isTableHeader) {
      console.warn('⚠️ 테이블 셀이 선택되지 않음');
      toast.error('표의 셀을 선택해주세요.');
      return;
    }

    console.log('✅ 테이블 셀 선택 확인됨');

    const borderStyleStr = createBorderStyle(borderWidth, borderStyle, borderColor);
    console.log('🎨 적용할 테두리 스타일:', borderStyleStr);

    // 디버그 버튼과 동일한 방식으로 직접 적용
    try {
      if (borderSelection === 'none') {
        // 모든 테두리 제거 - DOM 직접 조작
        const selectedCells = getActualSelectedCells();
        const cellsToProcess = selectedCells.length > 0 ? selectedCells : (getCurrentCell() ? [getCurrentCell()!] : []);

        // DOM 직접 조작으로 강제 제거
        cellsToProcess.forEach((cell, index) => {
          cell.style.setProperty('border', 'none', 'important');
          console.log(`✅ 셀 ${index + 1} 모든 테두리 강제 제거`);
        });
        console.log(`✅ 모든 테두리 제거 (DOM 강제)`);
        console.log('✅ 모든 테두리 제거 완료');
      } else if (borderSelection === 'all') {
        // 모든 테두리 적용 - setCellAttribute 방식으로 변경 (디버그 테스트와 동일)
        console.log('🎨 전체 테두리 적용 (setCellAttribute 방식):', borderStyleStr);

        editor.chain().focus().setCellAttribute('borderTop', borderStyleStr).run();
        editor.chain().focus().setCellAttribute('borderBottom', borderStyleStr).run();
        editor.chain().focus().setCellAttribute('borderLeft', borderStyleStr).run();
        editor.chain().focus().setCellAttribute('borderRight', borderStyleStr).run();

        console.log('✅ 전체 테두리 적용 완료 (setCellAttribute):', borderStyleStr);
      } else if (borderSelection === 'top') {
        // 위쪽 테두리만 - setCellAttribute 방식
        console.log('🎨 위쪽 테두리만 적용 (setCellAttribute 방식):', borderStyleStr);

        // 위쪽만 적용, 다른 방향은 기존 스타일 유지
        editor.chain().focus().setCellAttribute('borderTop', borderStyleStr).run();

        console.log('✅ 위쪽 테두리 setCellAttribute 적용:', borderStyleStr);

        console.log('✅ 위쪽 테두리만 적용 완료 (DOM + z-index):', borderStyleStr);
      } else if (borderSelection === 'bottom') {
        // 아래쪽 테두리만 - DOM 직접 조작 (강화된 디버깅)
        console.log('🎨 아래쪽 테두리만 적용 (DOM 방식):', borderStyleStr);

        // 간단하게 현재 포커스된 셀만 사용
        if (!editor.isActive('tableCell') && !editor.isActive('tableHeader')) {
          console.error('❌ 테이블 셀이 선택되지 않음');
          toast.error('표의 셀을 선택해주세요');
          return;
        }

        // setCellAttribute 방식으로 변경 (DOM 조작은 TipTap에 의해 덮어써짐)
        // 아래쪽에 새 스타일 적용 (다른 방향은 유지)
        editor.chain().focus().setCellAttribute('borderBottom', borderStyleStr).run();


        console.log('✅ 아래쪽 테두리 setCellAttribute 적용:', borderStyleStr);
      } else if (borderSelection === 'left') {
        // 왼쪽 테두리만 - setCellAttribute 방식
        console.log('🎨 왼쪽 테두리만 적용 (setCellAttribute 방식):', borderStyleStr);

        // 왼쪽만 적용, 다른 방향은 기존 스타일 유지
        editor.chain().focus().setCellAttribute('borderLeft', borderStyleStr).run();

        console.log('✅ 왼쪽 테두리 setCellAttribute 적용:', borderStyleStr);
      } else if (borderSelection === 'right') {
        // 오른쪽 테두리만 - setCellAttribute 방식
        console.log('🎨 오른쪽 테두리만 적용 (setCellAttribute 방식):', borderStyleStr);

        // 오른쪽만 적용, 다른 방향은 기존 스타일 유지
        editor.chain().focus().setCellAttribute('borderRight', borderStyleStr).run();

        console.log('✅ 오른쪽 테두리 setCellAttribute 적용:', borderStyleStr);
      } else if (borderSelection === 'outside') {
        // 엑셀식 외곽 테두리 적용
        console.log('🟫 엑셀식 외곽 테두리 적용 시작');
        const selectedCells = getActualSelectedCells();

        if (selectedCells.length <= 1) {
          // 단일 셀이면 전체 테두리
          editor.chain().focus().setCellAttribute('borderTop', borderStyleStr).run();
          editor.chain().focus().setCellAttribute('borderBottom', borderStyleStr).run();
          editor.chain().focus().setCellAttribute('borderLeft', borderStyleStr).run();
          editor.chain().focus().setCellAttribute('borderRight', borderStyleStr).run();
          console.log('✅ 단일 셀 전체 테두리 적용');
        } else {
          // 여러 셀 선택 시 엑셀식 외곽 테두리
          const cellPositions = selectedCells.map(cell => getCellPosition(cell));
          const minRow = Math.min(...cellPositions.map(pos => pos.row));
          const maxRow = Math.max(...cellPositions.map(pos => pos.row));
          const minCol = Math.min(...cellPositions.map(pos => pos.col));
          const maxCol = Math.max(...cellPositions.map(pos => pos.col));

          console.log(`🗺️ 외곽 테두리 영역: ${minRow}-${maxRow}행, ${minCol}-${maxCol}열`);

          // 먼저 모든 선택 셀의 테두리 제거
          selectedCells.forEach(cell => {
            const pos = getCellPosition(cell);
            const cellIndex = Array.from(cell.closest('table')?.querySelectorAll('td, th') || []).indexOf(cell);

            // 임시로 셀에 식별자 추가 후 개별 처리
            cell.setAttribute('data-temp-pos', `${pos.row}-${pos.col}`);
          });

          // 외곽 셀들에만 해당 방향 테두리 적용
          selectedCells.forEach(cell => {
            const pos = getCellPosition(cell);
            const isTop = pos.row === minRow;
            const isBottom = pos.row === maxRow;
            const isLeft = pos.col === minCol;
            const isRight = pos.col === maxCol;

            // 각 셀을 focus하고 해당하는 외곽 테두리만 적용
            const selection = editor.state.selection;
            const cellElement = cell;

            // TipTap 셀 선택 후 속성 적용 (복잡하므로 DOM 직접 조작으로 임시 처리)
            if (isTop) cellElement.style.borderTop = borderStyleStr;
            if (isBottom) cellElement.style.borderBottom = borderStyleStr;
            if (isLeft) cellElement.style.borderLeft = borderStyleStr;
            if (isRight) cellElement.style.borderRight = borderStyleStr;

            console.log(`📍 외곽 셀 (${pos.row}, ${pos.col}): top=${isTop}, bottom=${isBottom}, left=${isLeft}, right=${isRight}`);
          });

          console.log('✅ 엑셀식 외곽 테두리 적용 완료');
        }
      } else if (borderSelection === 'inside') {
        // 엑셀식 안쪽 테두리 적용
        console.log('⊞ 엑셀식 안쪽 테두리 적용 시작');
        const selectedCells = getActualSelectedCells();

        if (selectedCells.length <= 1) {
          // 단일 셀이면 테두리 제거
          editor.chain().focus().setCellAttribute('borderTop', 'none').run();
          editor.chain().focus().setCellAttribute('borderBottom', 'none').run();
          editor.chain().focus().setCellAttribute('borderLeft', 'none').run();
          editor.chain().focus().setCellAttribute('borderRight', 'none').run();
          console.log('✅ 단일 셀 테두리 제거');
        } else {
          // 여러 셀 선택 시 엑셀식 안쪽 테두리
          const cellPositions = selectedCells.map(cell => getCellPosition(cell));
          const minRow = Math.min(...cellPositions.map(pos => pos.row));
          const maxRow = Math.max(...cellPositions.map(pos => pos.row));
          const minCol = Math.min(...cellPositions.map(pos => pos.col));
          const maxCol = Math.max(...cellPositions.map(pos => pos.col));

          console.log(`🗺️ 안쪽 테두리 영역: ${minRow}-${maxRow}행, ${minCol}-${maxCol}열`);

          // 안쪽 셀들에만 내부 구분선 적용
          selectedCells.forEach(cell => {
            const pos = getCellPosition(cell);
            const isTop = pos.row === minRow;
            const isBottom = pos.row === maxRow;
            const isLeft = pos.col === minCol;
            const isRight = pos.col === maxCol;

            // 내부 구분선 (외곽이 아닌 면에만 적용)
            const cellElement = cell;
            if (!isTop) cellElement.style.borderTop = borderStyleStr;
            if (!isBottom) cellElement.style.borderBottom = borderStyleStr;
            if (!isLeft) cellElement.style.borderLeft = borderStyleStr;
            if (!isRight) cellElement.style.borderRight = borderStyleStr;

            console.log(`📍 안쪽 셀 (${pos.row}, ${pos.col}): 내부구분선 적용`);
          });

          console.log('✅ 엑셀식 안쪽 테두리 적용 완료');
        }
      }
    } catch (error) {
      console.error('❌ 테두리 적용 실패:', error);
      toast.error('테두리 적용에 실패했습니다: ' + error);
      return;
    }

    const selectionText = {
      'none': '테두리 제거',
      'all': '전체 테두리',
      'top': '위쪽 테두리',
      'bottom': '아래쪽 테두리',
      'left': '왼쪽 테두리',
      'right': '오른쪽 테두리',
      'outside': '외곽 테두리',
      'inside': '안쪽 테두리'
    };

    // 적용 결과 확인
    setTimeout(() => {
      console.log('📋 적용 후 HTML:', editor.getHTML());
    }, 100);

    toast.success(`${selectionText[borderSelection]}가 적용되었습니다!`);
  }, [editor, borderSelection, borderWidth, borderStyle, borderColor, addToRecentBorderColors, borderApplicationOrder, getActualSelectedCells, getCurrentCell]);

  // initialContent 변경 시 에디터 내용 업데이트 (AI 작업 중이 아닐 때만)
  useEffect(() => {
    if (initialContent && initialContent !== content && editor && !showAICompletion) {
      console.log('🔄 에디터 내용 업데이트:', initialContent.substring(0, 50) + '...');
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

  // Ref 노출 (editor 정의 이후)
  useImperativeHandle(ref, () => ({
    chain: () => editor?.chain(),
    getHTML: () => editor?.getHTML() || ''
  }), [editor]);

  // 표 생성 함수 (editor 정의 이후)
  const handleCreateTable = useCallback(() => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: false })
      .run();

    setShowTableDropdown(false);
    toast.success(`${tableRows}×${tableCols} 표가 생성되었습니다!`);
  }, [editor, tableRows, tableCols]);

  // 표 클릭 감지 및 편집 패널 표시 (editor 정의 이후)
  useEffect(() => {
    if (!editor) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // 표 요소 클릭 감지
      if (target.closest('table')) {
        const table = target.closest('table');
        if (table) {
          // 표 위치 계산
          const rect = table.getBoundingClientRect();
          setTablePosition({
            x: rect.right + 10,
            y: rect.top
          });
          setShowTableEditor(true);

        }
      } else if (!target.closest('.table-editor-panel')) {
        // 표 편집 패널 외부 클릭 시 닫기
        setShowTableEditor(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [editor]);

  // 전체 본문 보강
  const handleFullContentAI = useCallback(async (fullContent: string, command?: string) => {
    if (!selectedBlog) return;

    setShowAICompletion(true);
    try {
      // 선택된 블로그의 디자인 설정 가져오기
      const designPrompt = await getDesignPrompt(selectedBlog);

      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fullContent,
          command: (command || '전체적으로 보강해줘') + (designPrompt ? '\n\n' + designPrompt : ''),
          context: `블로그 ID: ${selectedBlog}, 금융/투자 전문 블로그`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 전체 내용을 AI 보강 결과로 교체
        editor.commands.setContent(data.enhanced);
        setShowAIDropdown(false);
        toast.success('본문이 AI로 보강되었습니다!');
      } else {
        throw new Error(data.error || 'AI 보강 실패');
      }
    } catch (error) {
      console.error('❌ AI 보강 오류:', error);
      toast.error('AI 본문 보강에 실패했습니다.');
    } finally {
      setShowAICompletion(false);
    }
  }, [blogId, editor]);


  // 선택 텍스트 리라이팅
  const handleSelectedTextAI = useCallback(async (command: string) => {
    if (!selectedText.trim() || !command.trim() || !selectedBlog) return;

    setShowAICompletion(true);
    try {
      // 전체 본문 컨텍스트 포함
      const fullContent = editor.getHTML();

      // 선택된 블로그의 디자인 설정 가져오기
      const designPrompt = await getDesignPrompt(selectedBlog);

      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          command: command + (designPrompt ? '\n\n' + designPrompt : ''),
          fullContext: fullContent, // 글 양식 분석용
          context: `블로그 ID: ${selectedBlog}, 금융/투자 전문 블로그`
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 선택된 텍스트를 AI 결과로 교체
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(data.result).run();
        setShowAIDropdown(false);
        toast.success('텍스트가 AI로 개선되었습니다!');
      } else {
        throw new Error(data.error || 'AI 리라이팅 실패');
      }
    } catch (error) {
      console.error('❌ AI 리라이팅 오류:', error);
      toast.error('AI 리라이팅에 실패했습니다.');
    } finally {
      setShowAICompletion(false);
    }
  }, [selectedText, blogId, editor]);



  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">에디터 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* 상태 표시 바 */}
      <div className="flex items-center justify-between mb-4 px-6 py-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          {/* 저장 상태 */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isSaving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
            }`} />
            <span className="text-sm text-gray-600">
              {isSaving ? '저장 중...' : '자동 저장됨'}
            </span>
          </div>

          {/* 업로드 상태 */}
          {isImageUploading && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">이미지 업로드 중...</span>
            </div>
          )}

          {/* Gemini AI 상태 */}
          {showAICompletion && (
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              <Sparkles className="w-3 h-3 animate-pulse text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Gemini AI 작성 중...</span>
            </div>
          )}
        </div>

        {/* 단어 수 */}
        <div className="text-sm text-gray-500">
          {editor?.getText().split(' ').filter(word => word.length > 0).length || 0} 단어
        </div>
      </div>

      {/* 메인 에디터 */}
      <div className="relative border rounded-lg bg-white">
        {/* 편집 툴바 */}
        <div className="border-b p-2 flex items-center gap-1 bg-gray-50">
          {/* AI 버튼 - 드롭다운 방식 */}
          <div className="relative">
            <button
              onClick={handleAIButtonClick}
              disabled={showAICompletion}
              className={`p-2 rounded hover:bg-purple-50 border border-purple-200 transition-all ${
                showAICompletion ? 'bg-purple-100 text-purple-600' : 'text-purple-600 hover:border-purple-300'
              }`}
              title="AI 도움받기"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* AI 드롭다운 */}
            {showAIDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-20 min-w-[320px]">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  {aiMode === 'selected' ? 'AI 텍스트 리라이팅' : 'AI 본문 보강'}
                </h4>

                {/* 블로그 선택 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">대상 블로그:</label>
                  <select
                    value={selectedBlog}
                    onChange={(e) => onBlogChange?.(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    disabled={availableBlogs.length === 0}
                  >
                    {availableBlogs.length === 0 ? (
                      <option value="">로딩 중...</option>
                    ) : (
                      <>
                        <option value="">선택하세요</option>
                        {availableBlogs.map((blog) => (
                          <option key={blog.blogId} value={blog.blogId}>
                            {blog.displayName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                {/* 선택된 텍스트 (선택 모드일 때만) */}
                {aiMode === 'selected' && selectedText && (
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">선택된 텍스트:</label>
                    <div className="p-2 bg-gray-50 rounded text-xs max-h-20 overflow-y-auto">
                      &ldquo;{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}&rdquo;
                    </div>
                  </div>
                )}

                {/* AI 명령 */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">AI 명령:</label>
                  <input
                    type="text"
                    value={aiCommand}
                    onChange={(e) => setAiCommand(e.target.value)}
                    placeholder={
                      aiMode === 'selected'
                        ? "예: 더 전문적으로, 쉽게 설명"
                        : "예: 결론 추가, 예시 보강"
                    }
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && aiCommand.trim()) {
                        if (aiMode === 'selected') {
                          handleSelectedTextAI(aiCommand);
                        } else {
                          const fullContent = editor.getHTML();
                          handleFullContentAI(fullContent, aiCommand);
                        }
                      }
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (aiMode === 'selected') {
                        handleSelectedTextAI(aiCommand);
                      } else {
                        const fullContent = editor.getHTML();
                        handleFullContentAI(fullContent, aiCommand);
                      }
                    }}
                    disabled={!aiCommand.trim() || showAICompletion}
                    className="flex-1 bg-purple-600 text-white px-3 py-1 text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {showAICompletion ? '처리 중...' : 'AI 적용'}
                  </button>
                  <button
                    onClick={() => setShowAIDropdown(false)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="w-px h-6 bg-gray-300 mx-1" />

          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('underline') ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('strike') ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <Strikethrough className="w-4 h-4" />
          </button>
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
          <div className="relative">
            <button
              onClick={() => setShowColorPalette(!showColorPalette)}
              className={`p-2 rounded hover:bg-gray-100 ${
                editor?.isActive('textStyle') ? 'bg-purple-100 text-purple-600' : ''
              }`}
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* 구글 스타일 색상 팔레트 */}
            {showColorPalette && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-3 z-20">
                <div className="flex gap-0.5">
                  {/* 각 색상별 세로 그라데이션 */}

                  {/* 회색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#000000', '#434343', '#666666', '#999999', '#cccccc', '#efefef'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* 빨간색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#5b0f00', '#a61c00', '#cc0000', '#e06666', '#ea9999', '#f4cccc'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* 주황색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#783f04', '#b45f06', '#e69138', '#f6b26b', '#f9cb9c', '#fce5cd'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* 노란색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#7f6000', '#bf9000', '#f1c232', '#ffd966', '#ffe599', '#fff2cc'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* 초록색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#274e13', '#38761d', '#6aa84f', '#93c47d', '#b6d7a8', '#d9ead3'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* 파란색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#1c4587', '#1155cc', '#3c78d8', '#6d9eeb', '#9fc5e8', '#cfe2f3'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* 보라색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#20124d', '#351c75', '#674ea7', '#8e7cc3', '#b4a7d6', '#d9d2e9'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>

                  {/* 핑크색 계열 */}
                  <div className="flex flex-col gap-0.5">
                    {['#4c1130', '#741b47', '#a64d79', '#c27ba0', '#d5a6bd', '#ead1dc'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          editor?.chain().focus().setColor(color).run();
                          setShowColorPalette(false);
                        }}
                        className="w-6 h-6 border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-1 mt-3 pt-2 border-t">
                  <button
                    onClick={() => {
                      editor?.chain().focus().unsetColor().run();
                      setShowColorPalette(false);
                    }}
                    className="flex-1 px-2 py-1 text-xs border rounded hover:bg-gray-50"
                  >
                    기본색
                  </button>
                  <button
                    onClick={() => setShowColorPalette(false)}
                    className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 폰트 변경 버튼 */}
          <div className="relative">
            <button
              onClick={() => setShowFontDropdown(!showFontDropdown)}
              className="p-2 rounded hover:bg-gray-100 border border-gray-200"
              title="폰트 변경"
            >
              <Type className="w-4 h-4" />
            </button>

            {/* 폰트 드롭다운 */}
            {showFontDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 z-20 min-w-[180px]">
                <div className="space-y-1">
                  {[
                    { name: 'Pretendard', label: 'Pretendard (한국어)' },
                    { name: 'Inter', label: 'Inter (모던)' },
                    { name: 'Noto Sans KR', label: 'Noto Sans KR' },
                    { name: 'Georgia', label: 'Georgia (세리프)' },
                    { name: 'Times New Roman', label: 'Times (클래식)' }
                  ].map((font) => (
                    <button
                      key={font.name}
                      onClick={() => {
                        setCurrentFont(font.name);
                        setShowFontDropdown(false);
                        // 에디터 폰트 스타일 업데이트
                        const editorElement = document.querySelector('.ProseMirror');
                        if (editorElement) {
                          (editorElement as HTMLElement).style.fontFamily = font.name;
                        }
                      }}
                      className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 ${
                        currentFont === font.name ? 'bg-blue-50 text-blue-600 font-medium' : ''
                      }`}
                      style={{ fontFamily: font.name }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
          <div className="relative">
            <button
              onClick={() => setShowTableDropdown(!showTableDropdown)}
              className="p-2 rounded hover:bg-gray-100"
              title="테이블 삽입"
            >
              <TableIcon className="w-4 h-4" />
            </button>

            {/* 표 크기 선택 드롭다운 */}
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
                    onClick={handleCreateTable}
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
                  handleImageUpload(file).then((url) => {
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
        
        <EditorContent 
          editor={editor} 
          className="min-h-[600px] p-6 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
        />
      </div>

      {/* AI 도움말 */}
      <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>
            <strong>AI 버튼</strong>: 텍스트 선택 → 리라이팅 | 미선택 → 본문 보강 (명령 입력 후 실행)
          </span>
        </div>
      </div>

      {/* 엑셀 스타일 표 편집 패널 */}
      {showTableEditor && (
        <div
          className="table-editor-panel fixed bg-white border rounded-lg shadow-xl p-4 z-30 min-w-[280px]"
          style={{
            left: `${tablePosition.x}px`,
            top: `${tablePosition.y}px`
          }}
        >
          <div className="mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-green-600" />
              표 편집
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              셀을 드래그해서 선택 후 스타일을 변경하세요
            </p>
          </div>

          {/* 행/열 조작 */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">행/열 관리</h5>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => editor?.chain().focus().addRowBefore().run()}
                className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200"
              >
                ↑ 행 추가
              </button>
              <button
                onClick={() => editor?.chain().focus().addRowAfter().run()}
                className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200"
              >
                ↓ 행 추가
              </button>
              <button
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
              >
                ← 열 추가
              </button>
              <button
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
                className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
              >
                → 열 추가
              </button>
              <button
                onClick={() => {
                  if (confirm('현재 행을 삭제하시겠습니까?')) {
                    editor?.chain().focus().deleteRow().run();
                  }
                }}
                className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
              >
                행 삭제
              </button>
              <button
                onClick={() => {
                  if (confirm('현재 열을 삭제하시겠습니까?')) {
                    editor?.chain().focus().deleteColumn().run();
                  }
                }}
                className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
              >
                열 삭제
              </button>
            </div>
          </div>

          {/* 스마트 테두리 시스템 */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">테두리 설정</h5>

            {/* 테두리 설정 */}
            <div className="grid grid-cols-5 gap-1 mb-3">
              <button
                onClick={() => setBorderSelection('all')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderSelection === 'all' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setBorderSelection('top')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderSelection === 'top' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                }`}
              >
                위
              </button>
              <button
                onClick={() => setBorderSelection('bottom')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderSelection === 'bottom' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                }`}
              >
                아래
              </button>
              <button
                onClick={() => setBorderSelection('left')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderSelection === 'left' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                }`}
              >
                왼쪽
              </button>
              <button
                onClick={() => setBorderSelection('right')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderSelection === 'right' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                }`}
              >
                오른쪽
              </button>
            </div>
          </div>

          {/* 테두리 스타일 */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">테두리 스타일:</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setBorderStyle('solid')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderStyle === 'solid' ? 'bg-gray-100 border-gray-400' : ''
                }`}
              >
                ━ 실선
              </button>
              <button
                onClick={() => setBorderStyle('dashed')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderStyle === 'dashed' ? 'bg-gray-100 border-gray-400' : ''
                }`}
              >
                ┅ 점선
              </button>
              <button
                onClick={() => setBorderStyle('dotted')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderStyle === 'dotted' ? 'bg-gray-100 border-gray-400' : ''
                }`}
              >
                ⋯ 도트
              </button>
              <button
                onClick={() => setBorderStyle('double')}
                className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                  borderStyle === 'double' ? 'bg-gray-100 border-gray-400' : ''
                }`}
              >
                ═ 이중선
              </button>
            </div>
          </div>

          {/* 테두리 굵기 */}
          <div className="mb-3">
            <label className="block text-xs text-gray-600 mb-1">굵기:</label>
            <div className="grid grid-cols-4 gap-1">
              {['1px', '2px', '3px', '4px'].map((width) => (
                <button
                  key={width}
                  onClick={() => setBorderWidth(width as '1px' | '2px' | '3px' | '4px')}
                  className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                    borderWidth === width ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
                  }`}
                >
                  {width}
                </button>
              ))}
            </div>
          </div>

          {/* 테두리 색상 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1">색상:</label>

            {/* 색상 선택기 (메인) */}
            <div className="mb-2">
              <input
                type="color"
                value={borderColor}
                onChange={(e) => {
                  setBorderColor(e.target.value);
                  addToRecentBorderColors(e.target.value);
                }}
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>

          </div>

          {/* 적용 버튼 */}
          <button
            onClick={actualApplyBorderToSelection}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-sm"
          >
            ✨ 테두리 적용
          </button>

          {/* 셀 배경색 */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">셀 배경색</h5>

            {/* 기본 배경색 프리셋 (원래 작동하던 방식) */}
            <div className="flex gap-1 mb-2">
              {['#ffffff', '#f3f4f6', '#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff', '#fce7f3'].map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    editor?.chain().focus().setCellAttribute('backgroundColor', color).run();
                    addToRecentBgColors(color);
                    toast.success('셀 배경색이 변경되었습니다!');
                  }}
                  className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>

            {/* 배경색 선택기 */}
            <input
              type="color"
              defaultValue="#ffffff"
              onChange={(e) => {
                editor?.chain().focus().setCellAttribute('backgroundColor', e.target.value).run();
                addToRecentBgColors(e.target.value);
                toast.success('셀 배경색이 변경되었습니다!');
              }}
              className="w-full h-6 border border-gray-300 rounded cursor-pointer"
            />

            {/* 최근 사용한 배경색 팔레트 */}
            {recentBgColors.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500 mb-1 block">최근 사용한 색상</span>
                <div className="flex gap-1 flex-wrap">
                  {recentBgColors.map((color, index) => (
                    <button
                      key={`bg-${color}-${index}`}
                      onClick={() => {
                        editor?.chain().focus().setCellAttribute('backgroundColor', color).run();
                        addToRecentBgColors(color);
                        toast.success('셀 배경색이 변경되었습니다!');
                      }}
                      className="w-5 h-5 border border-gray-300 rounded hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 전체 삭제 */}
          <div className="pt-3 border-t">
            <button
              onClick={() => {
                if (confirm('표를 완전히 삭제하시겠습니까?')) {
                  editor?.chain().focus().deleteTable().run();
                  setShowTableEditor(false);
                }
              }}
              className="w-full px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
            >
              🗑️ 표 삭제
            </button>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={() => setShowTableEditor(false)}
            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
});

AdvancedNovelEditor.displayName = 'AdvancedNovelEditor';

export default AdvancedNovelEditor;
