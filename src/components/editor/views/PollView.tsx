"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart3, CheckCircle2, Circle, Square, CheckSquare } from 'lucide-react';

interface PollOption {
  text: string;
  votes: number;
}

interface PollData {
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  totalVotes: number;
}

interface PollViewProps {
  pollId: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  totalVotes?: number;
  blogId?: string;
  postId?: string;
  readOnly?: boolean;
}

export const PollView: React.FC<PollViewProps> = React.memo(({
  pollId,
  question,
  options,
  allowMultiple,
  totalVotes = 0,
  blogId,
  postId,
  readOnly = false,
}) => {
  // props로 받은 데이터로 초기화
  const [pollData, setPollData] = useState<PollData>({
    question,
    options: options.map(opt =>
      typeof opt === 'string' ? { text: opt, votes: 0 } : opt
    ),
    allowMultiple,
    totalVotes,
  });
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkIfVoted = useCallback(() => {
    // 로컬 스토리지에서 투표 여부 확인
    const voted = localStorage.getItem(`poll-voted-${pollId}`);
    if (voted) {
      setHasVoted(true);
      try {
        const savedSelections = JSON.parse(voted);
        setSelectedOptions(savedSelections);
      } catch (e) {
        console.error('투표 기록 파싱 실패:', e);
      }
    }
  }, [pollId]);

  // 투표 여부 확인
  useEffect(() => {
    checkIfVoted();
  }, [checkIfVoted]);

  const handleOptionToggle = useCallback((index: number) => {
    if (hasVoted || readOnly) return;

    if (allowMultiple) {
      // 복수 선택
      setSelectedOptions(prev =>
        prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      // 단일 선택
      setSelectedOptions([index]);
    }
  }, [hasVoted, readOnly, allowMultiple]);

  const handleSubmit = useCallback(async () => {
    if (selectedOptions.length === 0) {
      alert('선택지를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // blogId와 postId가 있으면 서버에 저장
      if (blogId && postId) {
        const response = await fetch(`/api/poll/${pollId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedOptions,
            blogId,
            postId,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          // 서버에서 받은 최신 데이터로 업데이트
          setPollData(result.data);
        }
      } else {
        // blogId/postId 없으면 로컬에서만 처리 (미리보기 등)
        const updatedOptions = pollData.options.map((option, index) => {
          if (selectedOptions.includes(index)) {
            return { ...option, votes: option.votes + 1 };
          }
          return option;
        });

        setPollData({
          ...pollData,
          options: updatedOptions,
          totalVotes: pollData.totalVotes + 1,
        });
      }

      // 로컬 스토리지에 투표 기록 저장
      localStorage.setItem(`poll-voted-${pollId}`, JSON.stringify(selectedOptions));
      setHasVoted(true);
    } catch (error) {
      console.error('투표 제출 실패:', error);
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOptions, blogId, postId, pollId, pollData]);

  const getPercentage = useCallback((votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  }, []);

  // 복수 선택일 때는 총 선택 수를 계산
  const getTotalForPercentage = useMemo(() => {
    if (allowMultiple) {
      // 복수 선택: 모든 옵션의 votes 합계 사용
      return pollData.options.reduce((sum, opt) => sum + opt.votes, 0);
    } else {
      // 단일 선택: 투표자 수 사용
      return pollData.totalVotes;
    }
  }, [allowMultiple, pollData.options, pollData.totalVotes]);

  return (
    <div className="poll-widget my-4 p-6 border border-gray-200 rounded-lg bg-white not-prose">
      {/* 헤더 */}
      <div className="flex items-start gap-3 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">{pollData.question}</h3>
          <p className="text-xs text-gray-500">
            {readOnly ? '투표 결과' : hasVoted ? '투표 완료' : allowMultiple ? '복수 선택 가능' : '하나만 선택하세요'} •
            총 {pollData.totalVotes}명 참여
          </p>
        </div>
      </div>

      {/* 투표 전: 선택지 */}
      {!hasVoted && !readOnly && (
        <div className="space-y-2 mb-4">
          {pollData.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionToggle(index)}
              className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-all ${
                selectedOptions.includes(index)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {allowMultiple ? (
                selectedOptions.includes(index) ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )
              ) : (
                selectedOptions.includes(index) ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )
              )}
              <span className="text-sm font-medium text-gray-900 text-left">
                {option.text}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 투표 후: 결과 */}
      {(hasVoted || readOnly) && (
        <div className="space-y-3 mb-4">
          {pollData.options.map((option, index) => {
            const percentage = getPercentage(option.votes, getTotalForPercentage);
            const isSelected = selectedOptions.includes(index);

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isSelected ? 'text-blue-600' : 'text-gray-700'}`}>
                      {option.text}
                    </span>
                    {isSelected && !readOnly && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="text-gray-600 font-medium">
                    {percentage}% ({option.votes})
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected && !readOnly ? 'bg-blue-600' : 'bg-gray-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 투표 버튼 */}
      {!hasVoted && !readOnly && (
        <button
          onClick={handleSubmit}
          disabled={selectedOptions.length === 0 || isSubmitting}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSubmitting ? '제출 중...' : '투표하기'}
        </button>
      )}
    </div>
  );
});

PollView.displayName = 'PollView';

export default PollView;
