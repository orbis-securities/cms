"use client";

import { useState, useEffect } from 'react';

interface CommonCode {
  groupCode: string;
  code: string;
  codeName: string;
  codeNameEn?: string;
  sortOrder?: number;
  useYn?: string;
}

interface CommonCodeSelectProps {
  groupCode: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showAll?: boolean;
  allLabel?: string;
}

export default function CommonCodeSelect({
  groupCode,
  value,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  className = '',
  showAll = true,
  allLabel = '전체',
}: CommonCodeSelectProps) {
  const [options, setOptions] = useState<CommonCode[]>([]);

  useEffect(() => {
    // localStorage에서 공통 코드 불러오기
    const loadCommonCode = () => {
      try {
        const commonCodeStr = localStorage.getItem('commonCode');
        if (commonCodeStr) {
          const commonCodeData = JSON.parse(commonCodeStr);

          let filteredOptions: CommonCode[] = [];

          // commonCode가 배열인 경우
          if (Array.isArray(commonCodeData)) {
            filteredOptions = commonCodeData
              .filter(item => item.groupCode === groupCode && item.useYn !== 'N')
          }
          // commonCode가 객체 형태인 경우 (예: { BLOG: [...], LANGUAGE: [...] })
          else if (typeof commonCodeData === 'object' && commonCodeData[groupCode]) {
            const groupData = commonCodeData[groupCode];
            if (Array.isArray(groupData)) {
              filteredOptions = groupData
                .filter(item => item.useYn !== 'N')
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            }
          }

          setOptions(filteredOptions);
        }
      } catch (error) {
        console.error('공통 코드 로드 실패:', error);
      }
    };

    loadCommonCode();
  }, [groupCode]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        disabled ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${className}`}
    >
      {showAll && <option value="">{allLabel}</option>}
      {!showAll && placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.code} value={option.code}>
          {option.codeName}
        </option>
      ))}
    </select>
  );
}
