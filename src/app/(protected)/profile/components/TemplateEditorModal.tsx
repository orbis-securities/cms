"use client";

import { useRef, useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';
import AdvancedNovelEditor, { AdvancedNovelEditorRef } from '@/components/editor/core/AdvancedNovelEditor';
import Button from '@/components/common/Button';
import { Template } from '@/types';

interface TemplateEditorModalProps {
  isOpen: boolean;
  editingTemplate: Template | null;
  templateTitle: string;
  templateContent: string;
  userId: string | undefined;
  onClose: () => void;
  onSaveSuccess: () => void;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  editorRef: React.RefObject<AdvancedNovelEditorRef | null>;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

export default function TemplateEditorModal({
  isOpen,
  editingTemplate,
  templateTitle,
  templateContent,
  userId,
  onClose,
  onSaveSuccess,
  onTitleChange,
  onContentChange,
  editorRef,
}: TemplateEditorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedContent, setHasLoadedContent] = useState(false);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedContent(false);
    }
  }, [isOpen]);

  // 템플릿 로드
  useEffect(() => {
    const loadTemplate = async () => {
      if (!editingTemplate || !userId) return;

      setIsLoading(true);
      setHasLoadedContent(false);

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${SUPABASE_URL}/getTemplate?templateId=${editingTemplate.templateId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (data.code === 'S' && data.result) {
          onTitleChange(data.result.template.title);
          onContentChange(data.result.template.content);
          // 컨텐츠 로드 완료 후 약간의 딜레이를 두고 플래그 설정
          setTimeout(() => setHasLoadedContent(true), 100);
        } else {
          toast.error(data.message || '템플릿을 불러오는데 실패했습니다.');
          onClose();
        }
      } catch (error) {
        console.error('템플릿 조회 실패:', error);
        toast.error('템플릿을 불러오는데 실패했습니다.');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && editingTemplate) {
      loadTemplate();
    } else if (isOpen && !editingTemplate) {
      // 새 템플릿일 경우
      setHasLoadedContent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingTemplate?.templateId, userId]);

  // 에디터의 자동 저장 핸들러 (초기 로딩 중에는 무시)
  const handleContentChange = (content: string) => {
    if (hasLoadedContent) {
      onContentChange(content);
    }
  };

  // 템플릿 저장
  const handleSaveTemplate = async () => {
    if (!userId) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    if (!templateTitle.trim()) {
      toast.error('템플릿 제목을 입력해주세요.');
      return;
    }

    const editorContent = editorRef.current?.getHTML?.() || templateContent;
    if (!editorContent.trim() || editorContent === '<p></p>') {
      toast.error('템플릿 내용을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');

      if (editingTemplate) {
        // 수정 모드
        const response = await fetch(`${SUPABASE_URL}/updateTemplate`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            templateId: editingTemplate.templateId,
            title: templateTitle.trim(),
            content: editorContent
          })
        });

        const data = await response.json();

        if (data.code === 'S') {
          toast.success('템플릿이 수정되었습니다.');
          onSaveSuccess();
          onClose();
        } else {
          toast.error(data.message || '템플릿 수정에 실패했습니다.');
        }
      } else {
        // 등록 모드
        const response = await fetch(`${SUPABASE_URL}/createTemplate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: templateTitle.trim(),
            content: editorContent
          })
        });

        const data = await response.json();

        if (data.code === 'S') {
          toast.success('템플릿이 생성되었습니다.');
          onSaveSuccess();
          onClose();
        } else {
          toast.error(data.message || '템플릿 생성에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('템플릿 저장 실패:', error);
      toast.error('템플릿 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            {editingTemplate ? '템플릿 수정' : '새 템플릿'}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveTemplate}
              disabled={isSaving || isLoading}
              variant="primary"
              icon={Save}
              loading={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 모달 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">템플릿을 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 제목 입력 */}
              <input
                type="text"
                placeholder="템플릿 제목을 입력하세요..."
                value={templateTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full text-xl font-semibold border-none outline-none"
              />

              {/* 에디터 */}
              <div className="border-t pt-4">
                <AdvancedNovelEditor
                  key={editingTemplate?.templateId || 'new'}
                  initialContent={templateContent}
                  onSave={handleContentChange}
                  selectedBlog="axi"
                  onBlogChange={() => {}}
                  onSetFeatured={() => {}}
                  featuredImage=""
                  simpleMode={true}
                  ref={editorRef}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
