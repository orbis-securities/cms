"use client";

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface EditorStatusBarProps {
  isSaving: boolean;
  isImageUploading: boolean;
  showAICompletion: boolean;
  wordCount: number;
}

export default function EditorStatusBar({
  isSaving,
  isImageUploading,
  showAICompletion,
  wordCount
}: EditorStatusBarProps) {
  return (
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
          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            <Sparkles className="w-3 h-3 animate-pulse text-purple-600" />
            <span className="text-sm font-medium text-purple-700">AI 작성 중...</span>
          </div>
        )}
      </div>

      {/* 단어 수 */}
      <div className="text-sm text-gray-500">
        {wordCount} 단어
      </div>
    </div>
  );
}