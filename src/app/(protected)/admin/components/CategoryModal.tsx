"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import CommonCodeSelect from '@/components/common/CommonCodeSelect';
import { Category } from '@/types';

const SUPABASE_URL = 'https://onfwfuixsubpwftdwqea.supabase.co/functions/v1';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  editData?: Category | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editData
}: CategoryModalProps) {
  const [formData, setFormData] = useState<Category>({
    categoryId: '',
    blogId: '',
    name: '',
    sortOrder: 0,
    useYn: 'Y'
  });

  const isEditMode = Boolean(formData.categoryId);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData
      });
    } else {
      setFormData({
        categoryId: '',
        blogId: '',
        name: '',
        sortOrder: 0,
        useYn: 'Y'
      });
    }
  }, [editData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.blogId || !formData.name) {
      alert('블로그, 카테고리명은 필수 입력 항목입니다.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const endpoint = isEditMode ? `${SUPABASE_URL}/updateCategory` : `${SUPABASE_URL}/createCategory`;

      const response = await fetch(endpoint, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blogId: formData.blogId,
          categoryId: formData.categoryId,
          name: formData.name,
          sortOrder: formData.sortOrder,
          useYn: formData.useYn
        })
      });

      const result = await response.json();

      if (result.code === 'S') {
        toast.success(isEditMode ? '카테고리가 수정되었습니다.' : '카테고리가 추가되었습니다.');
        handleClose();
        onSave();
      } else {
        toast.error(result.message || '카테고리 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 저장 실패:', error);
      toast.error('카테고리 저장에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setFormData({
      categoryId: '',
      blogId: '',
      name: '',
      sortOrder: 0,
      useYn: 'Y'
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm(`"${formData.name}" 카테고리를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${SUPABASE_URL}/deleteCategory`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          blogId: formData.blogId,
          categoryId: formData.categoryId
        })
      });

      const result = await response.json();

      if (result.code === 'S') {
        toast.success('카테고리가 삭제되었습니다.');
        handleClose();
        onDelete?.();
      } else {
        toast.error(result.message || '카테고리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      toast.error('카테고리 삭제에 실패했습니다.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            {isEditMode ? '카테고리 수정' : '카테고리 추가'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* 블로그 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              블로그 <span className="text-red-500">*</span>
            </label>
            <CommonCodeSelect
              groupCode="BLOG_ID"
              value={formData.blogId || ''}
              onChange={(value) => setFormData({ ...formData, blogId: value })}
              placeholder="블로그 선택"
              showAll={false}
              className="w-full"
              disabled={isEditMode}
            />
          </div>

          {/* 카테고리 ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 ID
            </label>
            {isEditMode ? (
              <input
                type="text"
                value={formData.categoryId || ''}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                disabled
              />
            ) : (
              <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500">
                자동 생성
              </div>
            )}
          </div>

          {/* 카테고리명 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="카테고리명을 입력하세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
            />
          </div>

          {/* 정렬순서 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              정렬순서 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.sortOrder || 0}
              onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
              placeholder="정렬순서를 입력하세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
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

          {/* 버튼 */}
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
  );
}