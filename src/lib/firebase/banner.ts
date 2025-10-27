import { db, storage } from './config';
import { collection, doc, setDoc, getDocs, deleteDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getCurrentUser } from './auth';

export interface Banner {
  bannerId: string;
  blogId: string;
  targetPage: string;
  langType: string;
  imageUrl: string;
  createdAt: Timestamp;
  createUser: string;
  updatedAt?: Timestamp;
  updateUser?: string;
}

/**
 * 배너 저장
 */
export async function saveBanner(
  blogId: string,
  targetPage: string,
  langType: string,
  imageFile: File
): Promise<string> {
  try {
    // 현재 로그인한 사용자 정보
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid || 'admin';

    // 타임스탬프 기반 배너 ID 생성
    const timestamp = Timestamp.now();
    const bannerId = timestamp.toMillis().toString();

    // 이미지를 Firebase Storage에 업로드
    const imageRef = ref(storage, `banners/${blogId}/${bannerId}`);
    await uploadBytes(imageRef, imageFile);
    const imageUrl = await getDownloadURL(imageRef);

    // 배너 데이터 생성
    const bannerData: Banner = {
      bannerId,
      blogId,
      targetPage,
      langType,
      imageUrl,
      createdAt: timestamp,
      createUser: userId
    };

    // Firestore에 저장: blogs/{blogId}/banner/{bannerId}
    const bannerRef = doc(db, 'blogs', blogId, 'banner', bannerId);
    await setDoc(bannerRef, bannerData);

    console.log('✅ 배너 저장 완료:', bannerId);
    return bannerId;
  } catch (error) {
    console.error('❌ 배너 저장 실패:', error);
    throw error;
  }
}

/**
 * 배너 삭제
 */
export async function deleteBanner(blogId: string, bannerId: string): Promise<void> {
  try {
    // Storage에서 이미지 삭제
    const imageRef = ref(storage, `banners/${blogId}/${bannerId}`);
    try {
      await deleteObject(imageRef);
    } catch (error) {
      console.log('이미지 삭제 실패 (없을 수 있음):', error);
    }

    // Firestore에서 배너 삭제
    const bannerRef = doc(db, 'blogs', blogId, 'banner', bannerId);
    await deleteDoc(bannerRef);

    console.log('✅ 배너 삭제 완료:', bannerId);
  } catch (error) {
    console.error('❌ 배너 삭제 실패:', error);
    throw error;
  }
}

/**
 * 특정 블로그의 배너 목록 조회
 */
export async function getBanners(blogId: string): Promise<Banner[]> {
  try {
    const bannersRef = collection(db, 'blogs', blogId, 'banner');
    const q = query(bannersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const banners: Banner[] = [];
    snapshot.forEach((doc) => {
      banners.push(doc.data() as Banner);
    });

    return banners;
  } catch (error) {
    console.error('❌ 배너 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 모든 블로그의 배너 목록 조회
 */
export async function getAllBanners(): Promise<Banner[]> {
  try {
    const blogsRef = collection(db, 'blogs');
    const blogsSnapshot = await getDocs(blogsRef);

    const allBanners: Banner[] = [];

    for (const blogDoc of blogsSnapshot.docs) {
      const blogId = blogDoc.id;
      const banners = await getBanners(blogId);
      allBanners.push(...banners);
    }

    return allBanners;
  } catch (error) {
    console.error('❌ 전체 배너 목록 조회 실패:', error);
    throw error;
  }
}
