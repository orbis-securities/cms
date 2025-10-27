"use client";

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BannerData) => void;
  editData?: BannerData | null;
  blogs: { blogId: string }[];
}

export interface BannerData {
  bannerId?: string;
  blogId: string;
  targetPage: string;
  langType: string;
  imageFile: File | null;
  imagePreview: string;
}

export default function BannerModal({
  isOpen,
  onClose,
  onSave,
  editData,
  blogs
}: BannerModalProps) {
  const [formData, setFormData] = useState<BannerData>({
    blogId: '',
    targetPage: '',
    langType: '',
    imageFile: null,
    imagePreview: ''
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData
      });
    } else {
      setFormData({
        blogId: blogs.length > 0 ? blogs[0].blogId : '',
        targetPage: '',
        langType: '',
        imageFile: null,
        imagePreview: ''
      });
    }
  }, [editData, blogs, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 선택해주세요.');
        return;
      }

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('파일 크기는 5MB 이하만 가능합니다.');
        return;
      }

      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          imageFile: file,
          imagePreview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.blogId) {
      toast.error('블로그를 선택해주세요.');
      return;
    }
    if (!formData.targetPage) {
      toast.error('위치를 선택해주세요.');
      return;
    }
    if (!formData.langType) {
      toast.error('언어를 선택해주세요.');
      return;
    }
    if (!formData.imageFile && !editData) {
      toast.error('이미지를 선택해주세요.');
      return;
    }

    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      blogId: blogs.length > 0 ? blogs[0].blogId : '',
      targetPage: '',
      langType: '',
      imageFile: null,
      imagePreview: ''
    });
    onClose();
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
              {editData ? '배너 수정' : '배너 추가'}
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
            {/* 블로그 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                블로그 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.blogId}
                onChange={(e) =>
                  setFormData({ ...formData, blogId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">블로그를 선택하세요</option>
                {blogs.map((blog) => (
                  <option key={blog.blogId} value={blog.blogId}>
                    {blog.blogId}
                  </option>
                ))}
              </select>
            </div>

            {/* 위치 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위치 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.targetPage}
                onChange={(e) =>
                  setFormData({ ...formData, targetPage: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">위치를 선택하세요</option>
                <option value="main">메인</option>
                <option value="detail">상세페이지</option>
              </select>
            </div>

            {/* 언어 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                언어 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.langType}
                onChange={(e) =>
                  setFormData({ ...formData, langType: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">언어를 선택하세요</option>
                <option value="ko">한국어</option>
                <option value="en">영어</option>
              </select>
            </div>

            {/* 이미지 파일 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {/* 파일 선택 버튼 */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="banner-image-input"
                  />
                  <label
                    htmlFor="banner-image-input"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formData.imageFile ? formData.imageFile.name : '이미지를 선택하세요'}
                    </span>
                  </label>
                </div>

                {/* 이미지 미리보기 */}
                {formData.imagePreview && (
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img
                      src={formData.imagePreview}
                      alt="미리보기"
                      className="w-full h-auto rounded"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editData ? '수정' : '추가'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
