"use client";

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import CommonCodeSelect from '@/components/common/CommonCodeSelect';
import { Banner } from '@/types';

const SUPABASE_URL = 'https://onfwfuixsubpwftdwqea.supabase.co/functions/v1';

// 클라이언트 전용 필드를 포함한 타입
interface BannerFormData extends Omit<Banner, 'bannerId' | 'bannerName' | 'imageUrl'> {
  bannerId?: string;
  bannerName?: string;
  imageUrl?: string;
  imageFile: File | null;
  imagePreview: string;
}

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editData?: Banner | null;
}

export default function BannerModal({
  isOpen,
  onClose,
  onSave,
  editData
}: BannerModalProps) {
  const [formData, setFormData] = useState<BannerFormData>({
    blogId: '',
    bannerName: '',
    positionCode: '',
    langType: '',
    linkUrl: '',
    viewOrder: 0,
    imageFile: null,
    imagePreview: ''
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        imageFile: null,
        imagePreview: editData.imageUrl || ''
      });
    } else {
      setFormData({
        blogId: '',
        bannerName: '',
        positionCode: '',
        langType: '',
        linkUrl: '',
        viewOrder: 0,
        imageFile: null,
        imagePreview: ''
      });
    }
  }, [editData, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 선택해주세요.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.blogId) {
      toast.error('블로그를 선택해주세요.');
      return;
    }
    if (!formData.bannerName) {
      toast.error('배너명을 입력해주세요.');
      return;
    }
    if (!formData.positionCode) {
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

    try {
      const token = localStorage.getItem('authToken');
      const isEditMode = Boolean(editData);

      // 이미지를 base64로 변환
      let imageBase64 = formData.imagePreview;
      if (formData.imageFile && !imageBase64) {
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.imageFile!);
        });
      }

      const endpoint = isEditMode ? `${SUPABASE_URL}/updateBanner` : `${SUPABASE_URL}/createBanner`;
      const method = isEditMode ? 'PUT' : 'POST';

      const requestBody: any = {
        blogId: formData.blogId,
        bannerName: formData.bannerName,
        positionCode: formData.positionCode,
        linkUrl: formData.linkUrl || '',
        langType: formData.langType,
        viewOrder: formData.viewOrder || 0
      };

      // 수정 모드일 때는 bannerId 추가
      if (isEditMode) {
        requestBody.bannerId = formData.bannerId;
      }

      // 이미지가 변경된 경우에만 imageUrl 추가
      if (formData.imageFile || !isEditMode) {
        requestBody.imageUrl = imageBase64;
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.code === 'S') {
        toast.success(isEditMode ? '배너가 수정되었습니다.' : '배너가 추가되었습니다.');
        handleClose();
        onSave();
      } else {
        toast.error(result.message || `배너 ${isEditMode ? '수정' : '추가'}에 실패했습니다.`);
      }
    } catch (error) {
      console.error('배너 저장 실패:', error);
      toast.error('배너 저장에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setFormData({
      blogId: '',
      bannerName: '',
      positionCode: '',
      langType: '',
      linkUrl: '',
      viewOrder: 0,
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
              <CommonCodeSelect
                groupCode="BLOG_ID"
                value={formData.blogId}
                onChange={(value) => setFormData({ ...formData, blogId: value })}
                placeholder="블로그 선택"
                showAll={false}
                className="w-full"
              />
            </div>

            {/* 배너명 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배너명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bannerName || ''}
                onChange={(e) => setFormData({ ...formData, bannerName: e.target.value })}
                placeholder="배너명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 위치 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                위치 <span className="text-red-500">*</span>
              </label>
              <CommonCodeSelect
                groupCode="BANNER_POSITION"
                value={formData.positionCode}
                onChange={(value) => setFormData({ ...formData, positionCode: value })}
                placeholder="위치 선택"
                showAll={false}
                className="w-full"
              />
            </div>

            {/* 언어 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                언어 <span className="text-red-500">*</span>
              </label>
              <CommonCodeSelect
                groupCode="LANG"
                value={formData.langType}
                onChange={(value) => setFormData({ ...formData, langType: value })}
                placeholder="언어 선택"
                showAll={false}
                className="w-full"
              />
            </div>

            {/* 링크 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                링크
              </label>
              <input
                type="text"
                value={formData.linkUrl || ''}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder="링크를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 순서 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                순서
              </label>
              <input
                type="number"
                value={formData.viewOrder || 0}
                onChange={(e) => setFormData({ ...formData, viewOrder: Number(e.target.value) })}
                placeholder="순서를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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