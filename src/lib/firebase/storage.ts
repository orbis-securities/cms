import { storage } from './config';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Firebase Storage에 이미지 업로드
 */
export async function uploadImageToStorage(
  file: File,
  blogId: string,
  folder: string = 'posts'
): Promise<string> {
  try {
    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드 가능합니다.');
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
    }

    // 고유 파일명 생성
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `blogs/${blogId}/${folder}/${fileName}`;

    // Storage 참조 생성
    const storageRef = ref(storage, filePath);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);
    
    // 다운로드 URL 획득
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('이미지 업로드 에러:', error);
    throw error;
  }
}

/**
 * 다중 이미지 업로드
 */
export async function uploadMultipleImages(
  files: File[],
  blogId: string,
  folder: string = 'posts'
): Promise<string[]> {
  const uploadPromises = files.map(file => 
    uploadImageToStorage(file, blogId, folder)
  );

  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('다중 이미지 업로드 에러:', error);
    throw error;
  }
}

/**
 * 이미지 삭제
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('이미지 삭제 에러:', error);
    throw error;
  }
}

/**
 * 특정 폴더의 모든 이미지 나열
 */
export async function listImagesInFolder(
  blogId: string,
  folder: string = 'posts'
): Promise<string[]> {
  try {
    const folderRef = ref(storage, `blogs/${blogId}/${folder}`);
    const result = await listAll(folderRef);
    
    const urlPromises = result.items.map(item => getDownloadURL(item));
    const urls = await Promise.all(urlPromises);
    
    return urls;
  } catch (error) {
    console.error('이미지 목록 조회 에러:', error);
    throw error;
  }
}

/**
 * 이미지 URL에서 파일명 추출
 */
export function getFileNameFromUrl(url: string): string {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.split('?')[0]; // 쿼리 파라미터 제거
}

/**
 * 이미지 압축 (클라이언트 사이드)
 */
export function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // 비율 유지하며 크기 조정
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // 압축 실패시 원본 반환
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 이미지 미리보기 생성
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('미리보기 생성 실패'));
      }
    };
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}