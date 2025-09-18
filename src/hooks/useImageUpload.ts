import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { uploadImageToStorage, compressImage } from '@/lib/firebase/storage';

export function useImageUpload(blogId: string) {
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    setIsImageUploading(true);
    try {
      console.log('📁 이미지 업로드 시작:', file.name, file.type, file.size);

      // 이미지 압축
      const compressedFile = await compressImage(file, 1200, 0.8);
      console.log('🗜️ 이미지 압축 완료:', compressedFile.size);

      const url = await uploadImageToStorage(compressedFile, blogId);
      console.log('✅ Firebase 업로드 완료:', url);

      toast.success(`이미지 업로드 완료: ${file.name}`);
      return url;
    } catch (error) {
      console.error('❌ 이미지 업로드 에러:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`이미지 업로드 실패: ${errorMessage}`);
      throw error;
    } finally {
      setIsImageUploading(false);
    }
  }, [blogId]);

  return {
    isImageUploading,
    handleImageUpload
  };
}