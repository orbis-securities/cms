"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdvancedNovelEditor, { AdvancedNovelEditorRef } from '@/components/editor/AdvancedNovelEditor';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';;
import { saveTemplateToFirestore } from '@/lib/firebase/templates';

export default function NewTemplatePage() {
  const router = useRouter();
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<AdvancedNovelEditorRef>(null);

  const handleSave = (content: string) => {
    setTemplateContent(content);
  };

  const handleSaveTemplate = async () => {
    if (!templateTitle.trim()) {
      toast.error('템플릿 제목을 입력해주세요');
      return;
    }

    // 에디터에서 최신 내용 가져오기
    const editorContent = editorRef.current?.getHTML?.() || templateContent;

    if (!editorContent.trim() || editorContent === '<p></p>') {
      toast.error('템플릿 내용을 입력해주세요');
      return;
    }

    setIsSaving(true);
    try {
      // Firebase에 템플릿 저장
      const templateId = await saveTemplateToFirestore(
        templateTitle,
        editorContent
      );

      console.log('✅ 템플릿 저장 완료:', templateId);
      toast.success('템플릿이 저장되었습니다!');

      // 잠시 후 프로필 페이지로 이동
      setTimeout(() => {
        router.push('/profile?tab=templates');
      }, 1000);
    } catch (error) {
      console.error('❌ 템플릿 저장 실패:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`템플릿 저장에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/profile?tab=templates"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              템플릿 관리로
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                새 템플릿 만들기
              </h1>
              <p className="text-sm text-gray-500">
                자주 사용하는 글 형식을 템플릿으로 저장하세요
              </p>
            </div>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 flex items-center gap-2"
            onClick={handleSaveTemplate}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                템플릿 저장
              </>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <input
              type="text"
              placeholder="템플릿 제목을 입력하세요..."
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              className="w-full text-2xl font-semibold border-none outline-none"
            />
          </div>

          <div>
            <AdvancedNovelEditor
              initialContent={templateContent}
              onSave={handleSave}
              blogId="template"
              ref={editorRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
