import { db } from './config';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Post, PostStatus } from '@/types/index';

// Firestore 연결 상태 확인 함수
function isFirestoreAvailable(): boolean {
  return !!(db && typeof db === 'object' && 'app' in db && db.app);
}

/**
 * Firestore에 포스트 저장
 */
export async function savePostToFirestore(
  title: string,
  content: string,
  blogId: string,
  metadata: {
    category: string;
    tags: string[];
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    status: PostStatus;
  }
): Promise<string> {
  try {
    // Firestore 연결 상태 확인
    if (!isFirestoreAvailable()) {
      console.log('🏗️ Firestore 연결 불가능, 저장 실패');
      throw new Error('Firestore connection not available');
    }

    console.log('📝 Firestore 포스트 저장 시작:', title);
    
    const postData: Omit<Post, 'id'> = {
      title: title.trim(),
      content: content.trim(),
      excerpt: generateExcerpt(content),
      blogId,
      categories: [metadata.category],
      tags: metadata.tags,
      status: metadata.status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      publishedAt: metadata.status === 'published' ? Timestamp.now() : null,
      scheduledAt: null,
      slug: generateSlug(title),
      authorId: 'admin', // 추후 사용자 시스템과 연동
      featuredImage: extractFirstImage(content),
      readingTime: Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
      viewCount: 0,
      seo: {
        metaTitle: metadata.metaTitle || title,
        metaDescription: metadata.metaDescription || generateExcerpt(content),
        keywords: metadata.keywords || [],
        ogImage: extractFirstImage(content),
      }
    };

    const docRef = await addDoc(collection(db, 'posts'), postData);
    console.log('✅ Firestore 포스트 저장 완료:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('❌ Firestore 포스트 저장 실패:', error);
    throw error;
  }
}

/**
 * 포스트 업데이트
 */
export async function updatePostInFirestore(
  postId: string,
  updates: Partial<Post>
): Promise<void> {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    console.log('✅ Firestore 포스트 업데이트 완료:', postId);
  } catch (error) {
    console.error('❌ Firestore 포스트 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 특정 블로그의 포스트 목록 가져오기
 */
export async function getPostsByBlog(blogId: string): Promise<Post[]> {
  try {
    const q = query(
      collection(db, 'posts'),
      where('blogId', '==', blogId),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      } as Post);
    });
    
    return posts;
  } catch (error) {
    console.error('❌ Firestore 포스트 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 포스트 상세 조회
 */
export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Post;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Firestore 포스트 조회 실패:', error);
    throw error;
  }
}

/**
 * 슬러그로 포스트 조회
 */
export async function getPostBySlug(blogId: string, slug: string): Promise<Post | null> {
  try {
    const q = query(
      collection(db, 'posts'),
      where('blogId', '==', blogId),
      where('slug', '==', slug),
      where('status', '==', 'published')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Post;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Firestore 포스트 슬러그 조회 실패:', error);
    throw error;
  }
}

/**
 * 텍스트에서 요약 생성 (HTML 태그 제거)
 */
function generateExcerpt(content: string, maxLength: number = 160): string {
  // HTML 태그 제거
  const textContent = content.replace(/<[^>]*>/g, '');
  
  if (textContent.length <= maxLength) {
    return textContent;
  }
  
  return textContent.substring(0, maxLength).trim() + '...';
}

/**
 * 제목에서 슬러그 생성
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 제거
    .replace(/^-|-$/g, '') // 시작/끝 하이픈 제거
    + '-' + Date.now(); // 고유성을 위한 타임스탬프 추가
}

/**
 * 콘텐츠에서 첫 번째 이미지 URL 추출
 */
function extractFirstImage(content: string): string | null {
  const imgRegex = /<img[^>]+src="([^">]+)"/;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
}