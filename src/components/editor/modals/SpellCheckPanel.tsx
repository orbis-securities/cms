"use client";

import React, { useState } from 'react';
import { CheckCircle, AlertCircle, X, Loader2, FileText } from 'lucide-react';

interface SpellError {
  id: string;
  original: string;
  suggestion: string;
  position: number;
  type: 'spelling' | 'spacing' | 'grammar';
}

interface SpellCheckPanelProps {
  isOpen: boolean;
  onClose: () => void;
  getContent: () => string;
  onApplyFix: (original: string, suggestion: string) => void;
}

const SpellCheckPanel: React.FC<SpellCheckPanelProps> = ({
  isOpen,
  onClose,
  getContent,
  onApplyFix
}) => {
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [fixedCount, setFixedCount] = useState(0);

  // 맞춤법 검사 실행
  const runSpellCheck = async () => {
    const content = getContent();
    console.log('🔍 맞춤법 검사 시작 - 원본 내용:', content);

    if (!content.trim()) {
      console.warn('⚠️ 내용이 비어있습니다');
      return;
    }

    setIsChecking(true);
    setErrors([]);
    setCheckedCount(0);
    setFixedCount(0);

    try {
      // HTML 태그 제거하여 순수 텍스트만 추출
      const textContent = content.replace(/<[^>]*>/g, '').trim();
      console.log('📝 추출된 텍스트:', textContent);

      if (!textContent) {
        console.warn('⚠️ 텍스트 추출 후 내용이 비어있습니다');
        setErrors([]);
        return;
      }

      console.log('📡 API 호출 중...');
      const response = await fetch('/api/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent
        }),
      });

      const data = await response.json();
      console.log('📦 API 응답:', data);

      if (response.ok && data.success) {
        // AI 응답에서 JSON 부분 추출
        const aiResponse = data.result;
        console.log('🤖 AI 응답 원문:', aiResponse);
        let parsedErrors: SpellError[] = [];

        try {
          // JSON 부분만 추출 (```json ... ``` 형태나 순수 JSON)
          const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            parsedErrors = errorData.map((error: any, index: number) => ({
              id: `error-${index}`,
              original: error.original || '',
              suggestion: error.suggestion || '',
              position: index,
              type: error.type || 'spelling'
            })).filter((error: SpellError) => error.original && error.suggestion);
          }
        } catch (parseError) {
          console.warn('JSON 파싱 실패, 대안 파싱 시도:', parseError);
          // JSON 파싱 실패 시 텍스트에서 패턴 추출
          parsedErrors = extractErrorsFromText(aiResponse);
        }

        setErrors(parsedErrors);
        setCheckedCount(parsedErrors.length);
      }
    } catch (error) {
      console.error('❌ 맞춤법 검사 오류:', error);
      setErrors([]);
    } finally {
      setIsChecking(false);
    }
  };

  // 텍스트에서 오류 패턴 추출하는 대안 함수
  const extractErrorsFromText = (text: string): SpellError[] => {
    const errors: SpellError[] = [];
    // 간단한 패턴 매칭으로 오류 추출
    const lines = text.split('\n');
    let errorIndex = 0;

    lines.forEach(line => {
      // "잘못된것" → "올바른것" 패턴 찾기
      const arrowPattern = /["'](.*?)["']\s*[→\-][>]?\s*["'](.*?)["']/g;
      const matches = line.match(arrowPattern);
      if (matches) {
        matches.forEach(match => {
          const parts = match.match(/["'](.*?)["']\s*[→\-][>]?\s*["'](.*?)["']/);
          if (parts) {
            errors.push({
              id: `error-${errorIndex++}`,
              original: parts[1],
              suggestion: parts[2],
              position: errorIndex,
              type: 'spelling'
            });
          }
        });
      }
    });

    return errors;
  };

  // 수정 적용
  const handleApplyFix = (error: SpellError) => {
    onApplyFix(error.original, error.suggestion);
    setFixedCount(prev => prev + 1);
    setErrors(prev => prev.filter(e => e.id !== error.id));
  };

  // 모든 수정 적용
  const handleApplyAllFixes = () => {
    errors.forEach(error => {
      onApplyFix(error.original, error.suggestion);
    });
    setFixedCount(prev => prev + errors.length);
    setErrors([]);
  };

  const getTypeIcon = (type: SpellError['type']) => {
    switch (type) {
      case 'spelling': return '🔤';
      case 'spacing': return '📏';
      case 'grammar': return '📝';
      default: return '❓';
    }
  };

  const getTypeLabel = (type: SpellError['type']) => {
    switch (type) {
      case 'spelling': return '맞춤법';
      case 'spacing': return '띄어쓰기';
      case 'grammar': return '문법';
      default: return '기타';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-20 w-80 h-[calc(100vh-6rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">맞춤법 검사</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 검사 실행 버튼 */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={runSpellCheck}
          disabled={isChecking}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              검사 중...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              맞춤법 검사 시작
            </>
          )}
        </button>
      </div>

      {/* 통계 */}
      {(checkedCount > 0 || fixedCount > 0) && (
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-red-600">{errors.length}</div>
              <div className="text-xs text-gray-600">발견된 오류</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">{fixedCount}</div>
              <div className="text-xs text-gray-600">수정 완료</div>
            </div>
          </div>
        </div>
      )}

      {/* 오류 목록 */}
      <div className="flex-1 overflow-y-auto">
        {errors.length === 0 && !isChecking && checkedCount === 0 && (
          <div className="p-6 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm">맞춤법 검사를 시작하려면<br />위 버튼을 클릭하세요</p>
          </div>
        )}

        {errors.length === 0 && !isChecking && checkedCount > 0 && (
          <div className="p-6 text-center text-green-600">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium">검사 완료!</p>
            <p className="text-sm text-gray-600 mt-1">맞춤법 오류를 찾을 수 없습니다</p>
          </div>
        )}

        {errors.length > 0 && (
          <>
            {/* 전체 수정 버튼 */}
            <div className="p-3 border-b border-gray-100">
              <button
                onClick={handleApplyAllFixes}
                className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                모든 수정 적용 ({errors.length}개)
              </button>
            </div>

            {/* 오류 목록 */}
            <div className="space-y-2 p-3">
              {errors.map((error) => (
                <div key={error.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(error.type)}</span>
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {getTypeLabel(error.type)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleApplyFix(error)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      수정
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-600 font-medium">틀림:</span>
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                        {error.original}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-green-600 font-medium">수정:</span>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                        {error.suggestion}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SpellCheckPanel;