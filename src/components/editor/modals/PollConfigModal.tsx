"use client";

import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart3 } from 'lucide-react';

interface PollConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: {
    question: string;
    options: string[];
    allowMultiple: boolean;
  }) => void;
}

export default function PollConfigModal({ isOpen, onClose, onConfirm }: PollConfigModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleConfirm = () => {
    // 유효성 검사
    if (!question.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('최소 2개의 선택지를 입력해주세요.');
      return;
    }

    onConfirm({
      question: question.trim(),
      options: validOptions,
      allowMultiple,
    });

    // 초기화
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
  };

  const handleCancel = () => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">투표/설문조사 만들기</h3>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 질문 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              질문 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 자동매매 돌릴 때 가장 신경 쓰는 건 뭔가요?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{question.length}/200</p>
          </div>

          {/* 투표 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              투표 타입
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!allowMultiple}
                  onChange={() => setAllowMultiple(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">단일 선택 (투표)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={allowMultiple}
                  onChange={() => setAllowMultiple(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">복수 선택 (설문조사)</span>
              </label>
            </div>
          </div>

          {/* 선택지 입력 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                선택지 <span className="text-red-500">*</span>
              </label>
              <button
                onClick={handleAddOption}
                disabled={options.length >= 10}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                선택지 추가
              </button>
            </div>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`선택지 ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={100}
                    />
                  </div>
                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              최소 2개, 최대 10개의 선택지를 추가할 수 있습니다.
            </p>
          </div>

          {/* 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">미리보기</h4>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h5 className="font-medium text-gray-900 mb-3">
                {question || '질문을 입력하세요'}
              </h5>
              <div className="space-y-2">
                {options.filter(opt => opt.trim()).map((option, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                    <input
                      type={allowMultiple ? 'checkbox' : 'radio'}
                      disabled
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </div>
                ))}
                {options.filter(opt => opt.trim()).length === 0 && (
                  <p className="text-sm text-gray-400">선택지를 입력하세요</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            삽입
          </button>
        </div>
      </div>
    </div>
  );
}
