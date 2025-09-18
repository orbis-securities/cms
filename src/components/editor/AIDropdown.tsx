"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

interface AIDropdownProps {
  showAIDropdown: boolean;
  setShowAIDropdown: (show: boolean) => void;
  aiMode: 'selected' | 'full';
  selectedText: string;
  aiCommand: string;
  setAiCommand: (command: string) => void;
  selectedBlog?: string;
  availableBlogs: { blogId: string; displayName: string }[];
  onBlogChange?: (blogId: string) => void;
  onSelectedTextAI: (command: string) => void;
  onFullContentAI: (fullContent: string, command?: string) => void;
  showAICompletion: boolean;
  editor: any;
}

export default function AIDropdown({
  showAIDropdown,
  setShowAIDropdown,
  aiMode,
  selectedText,
  aiCommand,
  setAiCommand,
  selectedBlog,
  availableBlogs,
  onBlogChange,
  onSelectedTextAI,
  onFullContentAI,
  showAICompletion,
  editor
}: AIDropdownProps) {
  if (!showAIDropdown) return null;

  return (
    <div className="ai-dropdown-container absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-20 min-w-[320px]">
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
            "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
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
                onSelectedTextAI(aiCommand);
              } else {
                const fullContent = editor?.getHTML();
                onFullContentAI(fullContent, aiCommand);
              }
            }
          }}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            if (aiMode === 'selected') {
              onSelectedTextAI(aiCommand);
            } else {
              const fullContent = editor?.getHTML();
              onFullContentAI(fullContent, aiCommand);
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
  );
}