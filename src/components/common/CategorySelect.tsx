"use client";

import { useState, useEffect } from 'react';

interface Category {
  categoryId: string;
  name: string;
  useYn: string;
}

interface CategorySelectProps {
  blogId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showAll?: boolean;
  allLabel?: string;
  initialCategoryId?: string; // 수정 모드에서 초기 카테고리 ID
}

export default function CategorySelect({
  blogId,
  value,
  onChange,
  placeholder = '선택하세요',
  disabled = false,
  className = '',
  showAll = true,
  allLabel = '전체',
  initialCategoryId = '',
}: CategorySelectProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // blogId가 없거나 빈 문자열이면 초기화
    if (!blogId || blogId === 'all' || blogId === '') {
      setCategories([]);
      return;
    }

    // 카테고리 로드
    const loadCategories = async () => {
      setLoading(true);

      // 초기 로드가 아닐 때만 카테고리 선택 초기화 (사용자가 블로그를 변경한 경우)
      if (!isInitialLoad) {
        onChange('');
      }

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/getCategories?blogId=${blogId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();

        if (data.code === "S" && data.result) {
          // data.result가 배열인지 확인
          let categoriesData = data.result;

          // result가 객체이고 categories 키를 가진 경우
          if (!Array.isArray(categoriesData) && categoriesData.categories) {
            categoriesData = categoriesData.categories;
          }

          // 배열인 경우 그대로 사용
          if (Array.isArray(categoriesData)) {
            setCategories(categoriesData);
          } else {
            console.error('카테고리 데이터가 배열이 아닙니다:', categoriesData);
            setCategories([]);
          }
        }
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
        setCategories([]);
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadCategories();
  }, [blogId, isInitialLoad, onChange]);

  // 카테고리 목록이 로드된 후 initialCategoryId가 있으면 자동 설정
  useEffect(() => {
    if (categories.length > 0 && initialCategoryId && !value) {
      // 카테고리 목록에 initialCategoryId가 존재하는지 확인
      const categoryExists = categories.some(cat => cat.categoryId === initialCategoryId);
      if (categoryExists) {
        onChange(initialCategoryId);
      }
    }
  }, [categories, initialCategoryId, value, onChange]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || loading || categories.length === 0}
      className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
        disabled || loading || categories.length === 0 ? 'bg-gray-100 cursor-not-allowed' : ''
      } ${className}`}
    >
      {showAll && <option value="">{allLabel}</option>}
      {!showAll && placeholder && <option value="">{placeholder}</option>}
      {loading ? (
        <option value="">로딩 중...</option>
      ) : (
        categories.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>
            {category.name}
          </option>
        ))
      )}
    </select>
  );
}
