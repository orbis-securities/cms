"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryData) => void;
  editData?: CategoryData | null;
  blogs: { blogId: string }[];
}

export interface CategoryData {
  categoryId?: string;
  blogId: string;
  categoryKo: string;
  categoryEn: string;
  descriptionKo: string;
  descriptionEn: string;
  status: 'Y' | 'N';
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  editData,
  blogs
}: CategoryModalProps) {
  const [formData, setFormData] = useState<CategoryData>({
    blogId: '',
    categoryKo: '',
    categoryEn: '',
    descriptionKo: '',
    descriptionEn: '',
    status: 'Y'
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        categoryKo: editData.categoryKo || '',
        categoryEn: editData.categoryEn || '',
        descriptionKo: editData.descriptionKo || '',
        descriptionEn: editData.descriptionEn || ''
      });
    } else {
      setFormData({
        blogId: blogs.length > 0 ? blogs[0].blogId : '',
        categoryKo: '',
        categoryEn: '',
        descriptionKo: '',
        descriptionEn: '',
        status: 'Y'
      });
    }
  }, [editData, blogs, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.blogId || !formData.categoryKo || !formData.categoryEn ||
        !formData.descriptionKo || !formData.descriptionEn) {
      alert('블로그, 카테고리(한국어/영어), 설명(한국어/영어)은 필수 입력 항목입니다.');
      return;
    }

    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      blogId: blogs.length > 0 ? blogs[0].blogId : '',
      categoryKo: '',
      categoryEn: '',
      descriptionKo: '',
      descriptionEn: '',
      status: 'Y'
    });
    onClose();
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
            {editData ? '카테고리 수정' : '카테고리 추가'}
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
            <select
              value={formData.blogId}
              onChange={(e) => setFormData({ ...formData, blogId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
            >
              <option value="">블로그 선택</option>
              {blogs.map((blog) => (
                <option key={blog.blogId} value={blog.blogId}>
                  {blog.blogId}
                </option>
              ))}
            </select>
          </div>

          {/* 카테고리 입력 - 한국어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 (한국어) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.categoryKo || ''}
              onChange={(e) => setFormData({ ...formData, categoryKo: e.target.value })}
              placeholder="한국어 카테고리명을 입력하세요"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
            />
          </div>

          {/* 카테고리 입력 - 영어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              카테고리 (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.categoryEn || ''}
              onChange={(e) => setFormData({ ...formData, categoryEn: e.target.value })}
              placeholder="Enter category name in English"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
            />
          </div>

          {/* 설명 입력 - 한국어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (한국어) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.descriptionKo || ''}
              onChange={(e) => setFormData({ ...formData, descriptionKo: e.target.value })}
              placeholder="한국어 설명을 입력하세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
              required
            />
          </div>

          {/* 설명 입력 - 영어 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              설명 (English) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.descriptionEn || ''}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              placeholder="Enter description in English"
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
              required
            />
          </div>

          {/* 상태 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Y' | 'N' })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              required
            >
              <option value="Y">사용중</option>
              <option value="N">사용안함</option>
            </select>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editData ? '수정' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
