"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import CommonCodeSelect from '@/components/common/CommonCodeSelect';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

interface CategoryTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  editData: CategoryTranslationData | null;
}

export interface CategoryTranslationData {
  categoryId: string;
  blogId: string;
  langType: string;
  name: string;
  description: string;
  useYn?: string;
  blogNm?: string;
  categoryNm?: string;
}

export default function CategoryTranslationModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editData
}: CategoryTranslationModalProps) {
  const [formData, setFormData] = useState<CategoryTranslationData>({
    categoryId: '',
    blogId: '',
    langType: '',
    name: '',
    description: '',
    useYn: 'Y',
    blogNm: '',
    categoryNm: ''
  });

  const isEditMode = Boolean(editData?.langType);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        useYn: editData.useYn || 'Y',
        blogNm: editData.blogNm || '',
        categoryNm: editData.categoryNm || ''
      });
    } else {
      setFormData({
        categoryId: '',
        blogId: '',
        langType: '',
        name: '',
        description: '',
        useYn: 'Y',
        blogNm: '',
        categoryNm: ''
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.langType) {
      toast.error('언어를 선택해주세요.');
      return;
    }
    if (!formData.name) {
      toast.error('카테고리명을 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isEditMode ? `${SUPABASE_URL}/updateCategoryTranslation` : `${SUPABASE_URL}/createCategoryTranslation`;

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blogId: formData.blogId,
          categoryId: formData.categoryId,
          langType: formData.langType,
          name: formData.name,
          description: formData.description,
          useYn: formData.useYn
        })
      });

      const result = await response.json();

      if (result.code === 'S') {
        toast.success(isEditMode ? '다국어가 수정되었습니다.' : '다국어가 추가되었습니다.');
        handleClose();
        onSave();
      } else {
        toast.error(result.message || '다국어 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('다국어 저장 실패:', error);
      toast.error('다국어 저장에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setFormData({
      categoryId: '',
      blogId: '',
      langType: '',
      name: '',
      description: '',
      useYn: 'Y',
      blogNm: '',
      categoryNm: ''
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm(`"${formData.name}" 다국어를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${SUPABASE_URL}/deleteCategoryTranslation`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blogId: formData.blogId,
          categoryId: formData.categoryId,
          langType: formData.langType
        })
      });

      const result = await response.json();

      if (result.code === 'S') {
        toast.success('다국어가 삭제되었습니다.');
        handleClose();
        onDelete?.();
      } else {
        toast.error(result.message || '다국어 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('다국어 삭제 실패:', error);
      toast.error('다국어 삭제에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* 배경 오버레이 */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />

        {/* 모달 컨텐츠 */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 z-10">
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              {isEditMode ? '카테고리 다국어 수정' : '카테고리 다국어 추가'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 블로그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                블로그
              </label>
              <input
                type="text"
                value={formData.blogNm || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>

            {/* 카테고리명 (원본) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리명
              </label>
              <input
                type="text"
                value={formData.categoryNm || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                disabled
              />
            </div>

            {/* 언어 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                언어 <span className="text-red-500">*</span>
              </label>
              <CommonCodeSelect
                groupCode="LANG"
                value={formData.langType}
                onChange={(value) => setFormData({ ...formData, langType: value })}
                placeholder="언어 선택"
                className="w-full h-10"
                disabled={editData?.langType !== ''}
              />
            </div>

            {/* 카테고리명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="카테고리명 입력"
              />
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                설명
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="설명 입력"
              />
            </div>

            {/* 사용여부 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용여부 <span className="text-red-500">*</span>
              </label>
              <CommonCodeSelect
                groupCode="USE_YN"
                value={formData.useYn || 'Y'}
                onChange={(value) => setFormData({ ...formData, useYn: value })}
                placeholder="사용여부 선택"
                showAll={false}
                className="w-full"
                disabled={!isEditMode}
              />
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end gap-3 mt-6">
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  삭제
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditMode ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
