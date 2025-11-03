import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useImageUpload(blogId: string) {
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    setIsImageUploading(true);
    try {
      console.log('📁 이미지 base64 변환 시작:', file.name, file.type, file.size);

      // 파일 유효성 검사
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      // 파일 크기 제한 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
      }

      // base64로 변환
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('✅ base64 변환 완료');
      return base64;
    } catch (error) {
      console.error('❌ 이미지 변환 에러:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`이미지 변환 실패: ${errorMessage}`);
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