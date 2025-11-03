"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SimpleNovelEditorProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  blogId: string;
  className?: string;
}

export default function SimpleNovelEditor({
  initialContent = "",
  onSave,
  blogId,
  className
}: SimpleNovelEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  // 자동 저장 (3초마다)
  useEffect(() => {
    if (!content || !onSave) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      onSave(content);
      setTimeout(() => setIsSaving(false), 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [content, onSave]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    toast.info('이미지 업로드 기능은 준비 중입니다.');
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 저장 상태 표시 */}
      <div className="flex items-center justify-between mb-4 px-6">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isSaving ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
          }`} />
          <span className="text-sm text-gray-600">
            {isSaving ? '저장 중...' : '자동 저장됨'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded cursor-pointer hover:bg-blue-200"
          >
            📷 이미지 추가
          </label>
        </div>
      </div>

      {/* 간단한 Rich Text Editor */}
      <div className="border rounded-lg bg-white">
        <div
          className="min-h-[600px] w-full p-6 prose prose-lg max-w-none focus:outline-none"
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            setContent(e.currentTarget.innerHTML);
          }}
          onPaste={(e) => {
            // 간단한 paste 처리
            setTimeout(() => {
              setContent(e.currentTarget.innerHTML);
            }, 10);
          }}
          dangerouslySetInnerHTML={{ 
            __html: content || '<p>글을 작성해보세요...</p>' // AI 관련 텍스트 제거
          }}
        />
      </div>

      {/* 편집 도구 모음 */}
      <div className="mt-4 flex items-center gap-4 px-6">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            onClick={() => {
              document.execCommand('bold');
            }}
          >
            <strong>B</strong>
          </button>
          <button
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            onClick={() => {
              document.execCommand('italic');
            }}
          >
            <em>I</em>
          </button>
          <button
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            onClick={() => {
              document.execCommand('formatBlock', false, 'h1');
            }}
          >
            H1
          </button>
          <button
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            onClick={() => {
              document.execCommand('formatBlock', false, 'h2');
            }}
          >
            H2
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 ml-auto">
          <span>💡 팁: 이미지를 추가하고 텍스트 포맷팅을 사용해보세요</span>
        </div>
      </div>

      {/* AI 자동완성 안내 - 주석 처리 */}
      {/*
      <div className="mt-4 p-4 bg-blue-50 rounded-lg mx-6">
        <div className="flex items-center gap-2 text-blue-800">
          <span className="text-lg">🤖</span>
          <div>
            <div className="font-medium">AI 자동완성 준비됨</div>
            <div className="text-sm">더 고급 기능은 Novel Editor 통합 완료 후 사용 가능합니다</div>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}