"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AdvancedNovelEditor, { AdvancedNovelEditorRef } from '@/components/editor/AdvancedNovelEditor';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { getTemplateById, updateTemplateInFirestore } from '@/lib/firebase/templates';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const [templateTitle, setTemplateTitle] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const editorRef = useRef<AdvancedNovelEditorRef>(null);

  // 템플릿 데이터 로드
  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId) return;

      setIsLoading(true);
      try {
        const template = await getTemplateById(templateId);

        if (template) {
          setTemplateTitle(template.title);
          setTemplateContent(template.content);
          console.log('✅ 템플릿 로드 완료:', template.title);
        } else {
          toast.error('템플릿을 찾을 수 없습니다.');
          router.push('/profile?tab=templates');
        }
      } catch (error) {
        console.error('❌ 템플릿 로드 실패:', error);
        toast.error('템플릿을 불러오는데 실패했습니다.');
        router.push('/profile?tab=templates');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, router]);

  const handleSave = (content: string) => {
    setTemplateContent(content);
  };

  const handleUpdateTemplate = async () => {
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
      // Firebase에 템플릿 수정
      await updateTemplateInFirestore(templateId, {
        title: templateTitle,
        content: editorContent,
      });

      console.log('✅ 템플릿 수정 완료:', templateId);
      toast.success('템플릿이 수정되었습니다!');

      // 잠시 후 프로필 페이지로 이동
      setTimeout(() => {
        router.push('/profile?tab=templates');
      }, 1000);
    } catch (error) {
      console.error('❌ 템플릿 수정 실패:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`템플릿 수정에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">템플릿을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

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
                템플릿 수정
              </h1>
              <p className="text-sm text-gray-500">
                템플릿 내용을 수정하세요
              </p>
            </div>
          </div>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 flex items-center gap-2"
            onClick={handleUpdateTemplate}
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
