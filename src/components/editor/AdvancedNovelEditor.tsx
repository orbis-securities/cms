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
import { uploadImageToStorage, compressImage } from '@/lib/firebase/storage';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
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

// AI 자동완성 확장
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
  className?: string;
}

export interface AdvancedNovelEditorRef {
  chain: () => unknown | undefined;
}

const AdvancedNovelEditor = forwardRef<AdvancedNovelEditorRef, AdvancedNovelEditorProps>(({
  initialContent = "",
  onSave,
  blogId,
  className
}: AdvancedNovelEditorProps, ref) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [showAICompletion, setShowAICompletion] = useState(false);

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

  // AI 자동완성 핸들러
  const handleAICompletion = useCallback(async (prompt: string) => {
    setShowAICompletion(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          context: 'FX Trading Blog' 
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        return data.completion;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('AI 자동완성 실패');
      throw error;
    } finally {
      setShowAICompletion(false);
    }
  }, []);

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
          return 'AI와 함께 글을 작성해보세요. \'/\'를 눌러 시작하세요...';
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
      TableHeader,
      TableCell,
      Youtube.configure({
        width: 640,
        height: 480,
        allowFullscreen: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      AIAutoComplete,
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

  // 슬래시 커맨드 처리
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && editor.getText().endsWith('/')) {
        event.preventDefault();
        // AI 자동완성 트리거
        const currentText = editor.getText();
        if (currentText.length > 10) {
          const context = currentText.slice(-50); // 마지막 50자
          handleAICompletion(context).then((completion) => {
            if (completion) {
              editor.commands.insertContent(completion);
            }
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleAICompletion]);


  // Ref 노출
  useImperativeHandle(ref, () => ({
    chain: () => editor?.chain()
  }), [editor]);

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

          {/* AI 상태 */}
          {showAICompletion && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 animate-pulse text-purple-600" />
              <span className="text-sm text-purple-600">AI 작성 중...</span>
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
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-100 text-sm ${
              editor?.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-100 text-sm ${
              editor?.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-600' : ''
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('highlight') ? 'bg-yellow-100 text-yellow-600' : ''
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>
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
          <button
            onClick={() => {
              editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            }}
            className="p-2 rounded hover:bg-gray-100"
            title="테이블 삽입"
          >
            <TableIcon className="w-4 h-4" />
          </button>
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


      {/* 하단 툴팁 */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white rounded shadow text-xs">/</kbd>
            <span>AI 자동완성</span>
          </div>
          <div className="flex items-center gap-1">
            <span>드래그 앤 드롭</span>
            <ImageIcon className="w-4 h-4" />
            <span>이미지 업로드</span>
          </div>
          <div className="flex items-center gap-1">
            <span>이미지 클릭</span>
            <Settings className="w-4 h-4" />
            <span>크기/위치 조절</span>
          </div>
        </div>
      </div>
    </div>
  );
});

AdvancedNovelEditor.displayName = 'AdvancedNovelEditor';

export default AdvancedNovelEditor;