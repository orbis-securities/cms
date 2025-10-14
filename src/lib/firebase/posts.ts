import { db } from './config';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, setDoc, startAfter, limit, deleteDoc, collectionGroup } from 'firebase/firestore';
import { Post, PostStatus } from '@/types/index';

// Firestore 연결 상태 확인 함수
function isFirestoreAvailable(): boolean {
  return !!(db && typeof db === 'object' && 'app' in db && db.app);
}

/**
 * Firestore에 포스트 저장 (서브컬렉션 방식)
 */
export async function savePostToFirestore(
  title: string,
  content: string,
  blogId: string,
  metadata: {
    description?: string;
    category: string;
    tags: string[];
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    status: PostStatus;
    featuredImage?: string;
  },
  polls?: Array<{
    pollId: string;
    question: string;
    options: { text: string; votes: number }[];
    allowMultiple: boolean;
    totalVotes: number;
  }>
): Promise<string> {
  try {
    // Firestore 연결 상태 확인
    if (!isFirestoreAvailable()) {
      console.log('🏗️ Firestore 연결 불가능, 저장 실패');
      throw new Error('Firestore connection not available');
    }

    console.log('📝 Firestore 포스트 저장 시작:', title);

    // 타임스탬프 기반 문서 ID 생성
    const timestamp = Timestamp.now();
    const docId = timestamp.toMillis().toString();

    const postData: Omit<Post, 'id'> = {
      title: title.trim(),
      description: metadata.description || '',
      content: content.trim(),
      excerpt: generateExcerpt(content),
      blogId,
      categories: [metadata.category],
      tags: metadata.tags,
      status: metadata.status,
      createdAt: timestamp,
      updatedAt: timestamp,
      publishedAt: metadata.status === 'published' ? timestamp : null,
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
      },
      ...(polls && polls.length > 0 && {
        polls: polls
      })
    };

    // Collection Group 구조로 저장: blogs/{blogId}/posts/{timestamp}
    const postRef = doc(db, 'blogs', blogId, 'posts', docId);
    await setDoc(postRef, postData);

    console.log('✅ Firestore 포스트 저장 완료:', docId);

    return docId;
  } catch (error) {
    console.error('❌ Firestore 포스트 저장 실패:', error);
    throw error;
  }
}

/**
 * 포스트 업데이트 (서브컬렉션 방식)
 */
export async function updatePostInFirestore(
  blogId: string,
  postId: string,
  updates: Partial<Post>
): Promise<void> {
  try {
    const postRef = doc(db, 'blogs', blogId, 'posts', postId);
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
 * 특정 블로그의 전체 포스트 목록 가져오기 (모든 카테고리 순회)
 */
export async function getPostsByBlog(
  blogId: string,
  pageSize: number = 10,
  lastPostId?: string
): Promise<{ posts: Post[], hasMore: boolean }> {
  try {
    let q = query(
      collectionGroup(db, 'posts'),
      where('blogId', '==', blogId),
      limit(pageSize + 1)
    );

    if (lastPostId) {
      const lastDoc = await getDoc(doc(db, 'blogs', blogId, 'posts', lastPostId));
      if (lastDoc.exists()) {
        q = query(
          collectionGroup(db, 'posts'),
          where('blogId', '==', blogId),
          startAfter(lastDoc),
          limit(pageSize + 1)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      } as Post);
    });

    const hasMore = posts.length > pageSize;
    if (hasMore) {
      posts.pop();
    }

    return { posts, hasMore };
  } catch (error) {
    console.error('❌ Firestore 포스트 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 전체 블로그 포스트 가져오기 (페이징 없음, 모든 카테고리)
 */
export async function getAllPostsByBlog(blogId: string): Promise<Post[]> {
  try {
    // 먼저 블로그의 카테고리 목록을 가져옴
    const settings = await getBlogSettings(blogId);
    if (!settings || !settings.categories.length) {
      return [];
    }

    const allPosts: Post[] = [];

    // 각 카테고리별로 포스트 조회
    for (const category of settings.categories) {
      try {
        const categoryResult = await getPostsByCategory(blogId, category.name, 1000); // 카테고리당 최대 1000개
        allPosts.push(...categoryResult.posts);
      } catch (error) {
        console.warn(`카테고리 ${category.name} 조회 실패:`, error);
        // 특정 카테고리 실패해도 계속 진행
      }
    }

    // 시간순으로 정렬
    allPosts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    return allPosts;
  } catch (error) {
    console.error('❌ Firestore 포스트 목록 조회 실패:', error);
    throw error;
  }
}

/**
 * 포스트 상세 조회 (카테고리별 구조)
 */
export async function getPostById(blogId: string, postId: string): Promise<Post | null> {
  try {
    console.log('🔍 포스트 조회 시작:', { blogId, postId });
    const docRef = doc(db, 'blogs', blogId, 'posts', postId);
    const docSnap = await getDoc(docRef);

    console.log('📋 포스트 존재:', docSnap.exists());

    if (docSnap.exists()) {
      const postData = {
        id: docSnap.id,
        ...docSnap.data()
      } as Post;
      console.log('📊 로드된 포스트:', postData);
      return postData;
    }

    return null;
  } catch (error) {
    console.error('❌ Firestore 포스트 조회 실패:', error);
    throw error;
  }
}

/**
 * 슬러그로 포스트 조회 (서브컬렉션 방식)
 */
export async function getPostBySlug(blogId: string, slug: string): Promise<Post | null> {
  try {
    const q = query(
      collection(db, blogId),
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
 * 카테고리별 포스트 가져오기 (직접 접근 방식)
 */
export async function getPostsByCategory(
  blogId: string,
  category: string,
  pageSize: number = 10,
  lastPostId?: string
): Promise<{ posts: Post[], hasMore: boolean }> {
  try {
    let q = query(
      collectionGroup(db, 'posts'),
      where('blogId', '==', blogId),
      where('categories', 'array-contains', category),
      limit(pageSize + 1)
    );

    if (lastPostId) {
      const lastDoc = await getDoc(doc(db, 'blogs', blogId, 'posts', lastPostId));
      if (lastDoc.exists()) {
        q = query(
          collectionGroup(db, 'posts'),
          where('blogId', '==', blogId),
          where('categories', 'array-contains', category),
          startAfter(lastDoc),
          limit(pageSize + 1)
        );
      }
    }

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      } as Post);
    });

    const hasMore = posts.length > pageSize;
    if (hasMore) {
      posts.pop();
    }

    return { posts, hasMore };
  } catch (error) {
    console.error('❌ 카테고리별 포스트 조회 실패:', error);
    throw error;
  }
}

/**
 * 태그별 포스트 가져오기 (모든 카테고리에서 검색)
 */
export async function getPostsByTag(
  blogId: string,
  tag: string,
  pageSize: number = 10,
  lastPostId?: string
): Promise<{ posts: Post[], hasMore: boolean }> {
  try {
    // 먼저 블로그의 카테고리 목록을 가져옴
    const settings = await getBlogSettings(blogId);
    if (!settings || !settings.categories.length) {
      return { posts: [], hasMore: false };
    }

    const allPosts: Post[] = [];

    // 각 카테고리별로 태그가 포함된 포스트 조회
    for (const category of settings.categories) {
      try {
        const postsRef = collection(db, blogId, 'posts', category.name);
        const q = query(
          postsRef,
          where('status', '==', 'published'),
          where('tags', 'array-contains', tag)
        );

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          allPosts.push({
            id: doc.id,
            ...doc.data()
          } as Post);
        });
      } catch (error) {
        console.warn(`카테고리 ${category.name}에서 태그 검색 실패:`, error);
        // 특정 카테고리 실패해도 계속 진행
      }
    }

    // 시간순으로 정렬
    allPosts.sort((a, b) => {
      const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    });

    // 페이징 처리
    const startIndex = lastPostId ?
      allPosts.findIndex(post => post.id === lastPostId) + 1 : 0;

    const endIndex = startIndex + pageSize;
    const paginatedPosts = allPosts.slice(startIndex, endIndex);
    const hasMore = endIndex < allPosts.length;

    return { posts: paginatedPosts, hasMore };
  } catch (error) {
    console.error('❌ 태그별 포스트 조회 실패:', error);
    throw error;
  }
}

export interface Category {
  name: string;
  description: string;
  status: 'Y' | 'N';
}

export interface BlogDesignSettings {
  fontFamily: 'Inter' | 'Pretendard' | 'Noto Sans KR' | 'Georgia' | 'Times New Roman';
  heading: {
    fontSize: string;
    color: string;
  };
  subheading: {
    fontSize: string;
    color: string;
  };
  list: {
    fontSize: string;
    color: string;
  };
  highlight: {
    fontSize: string;
    color: string;
  };
  description: {
    fontSize: string;
    color: string;
  };
  textTone: 'professional' | 'casual' | 'technical';
}

/**
 * 블로그 설정 가져오기 (카테고리, 디자인 등)
 */
export async function getBlogSettings(blogId: string): Promise<{
  categories: Category[];
  design?: BlogDesignSettings;
} | null> {
  try {
    console.log('🔍 getBlogSettings 호출:', { blogId, type: typeof blogId });

    if (!blogId || typeof blogId !== 'string') {
      console.error('❌ 잘못된 blogId:', blogId);
      return null;
    }

    const settingsRef = doc(db, 'blogs', blogId, 'data', 'settings');
    const settingsSnap = await getDoc(settingsRef);

    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      console.log('📋 Settings 데이터:', data);
      const categories = Array.isArray(data.categories) ? data.categories : [];
      const design = data.design || getDefaultDesignSettings(blogId);
      console.log('📝 카테고리 배열:', categories);
      console.log('🎨 디자인 설정:', design);
      return {
        categories,
        design
      };
    }

    // 기본 설정 반환
    const defaultSettings = getDefaultBlogSettings(blogId);
    console.log('🔧 기본 설정 사용:', defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('❌ 블로그 설정 조회 실패:', error);
    return getDefaultBlogSettings(blogId);
  }
}

/**
 * 블로그 설정 저장/업데이트
 */
export async function saveBlogSettings(
  blogId: string,
  settings: {
    categories: Category[];
    design?: BlogDesignSettings;
  }
): Promise<void> {
  try {
    // 1. 부모 문서에 필드 추가 (빈 문서 방지)
    const blogRef = doc(db, 'blogs', blogId);
    await setDoc(blogRef, {
      active: true,
      createdAt: Timestamp.now()
    }, { merge: true });

    // 2. 설정 문서 저장
    const settingsRef = doc(db, 'blogs', blogId, 'data', 'settings');
    await setDoc(settingsRef, settings, { merge: true });

    console.log('✅ 블로그 설정 저장 완료:', blogId);
  } catch (error) {
    console.error('❌ 블로그 설정 저장 실패:', error);
    throw error;
  }
}

/**
 * 기본 블로그 설정
 */
function getDefaultBlogSettings(blogId: string): {
  categories: Category[];
  design: BlogDesignSettings;
} {
  switch (blogId) {
    case 'axi':
      return {
        categories: [
          { name: '시장 분석', description: '금융 시장 동향 및 분석', status: 'Y' },
          { name: '거래 전략', description: '효과적인 거래 전략 및 팁', status: 'Y' },
          { name: '경제 뉴스', description: '주요 경제 뉴스 및 이슈', status: 'Y' },
          { name: '테크니컬 분석', description: '차트 및 기술적 분석', status: 'Y' },
          { name: '투자 팁', description: '투자 관련 유용한 정보', status: 'Y' }
        ],
        design: getDefaultDesignSettings('axi')
      };
    case 'orbisLanding':
      return {
        categories: [
          { name: '회사 소식', description: '회사의 최신 소식', status: 'Y' },
          { name: '제품 업데이트', description: '제품 업데이트 및 새로운 기능', status: 'Y' },
          { name: '고객 사례', description: '고객 성공 사례', status: 'Y' },
          { name: '기술 블로그', description: '기술 관련 인사이트', status: 'Y' },
          { name: '이벤트', description: '이벤트 및 행사 정보', status: 'Y' }
        ],
        design: getDefaultDesignSettings('orbisLanding')
      };
    default:
      return {
        categories: [
          { name: '일반', description: '일반 게시물', status: 'Y' },
          { name: '공지사항', description: '중요 공지사항', status: 'Y' }
        ],
        design: getDefaultDesignSettings('default')
      };
  }
}

/**
 * 블로그별 기본 디자인 설정
 */
function getDefaultDesignSettings(blogId: string): BlogDesignSettings {
  switch (blogId) {
    case 'axi':
      return {
        fontFamily: 'Pretendard',
        heading: { fontSize: '28px', color: '#1F2937' },
        subheading: { fontSize: '22px', color: '#374151' },
        list: { fontSize: '16px', color: '#1F2937' },
        highlight: { fontSize: '16px', color: '#FBBF24' },
        description: { fontSize: '14px', color: '#6B7280' },
        textTone: 'professional'
      };
    case 'orbisLanding':
      return {
        fontFamily: 'Inter',
        heading: { fontSize: '24px', color: '#1E40AF' },
        subheading: { fontSize: '20px', color: '#3B82F6' },
        list: { fontSize: '16px', color: '#1F2937' },
        highlight: { fontSize: '16px', color: '#3B82F6' },
        description: { fontSize: '14px', color: '#64748B' },
        textTone: 'casual'
      };
    default:
      return {
        fontFamily: 'Noto Sans KR',
        heading: { fontSize: '26px', color: '#000000' },
        subheading: { fontSize: '20px', color: '#374151' },
        list: { fontSize: '16px', color: '#1F2937' },
        highlight: { fontSize: '16px', color: '#FBBF24' },
        description: { fontSize: '14px', color: '#6B7280' },
        textTone: 'professional'
      };
  }
}

/**
 * 포스트 삭제
 */
export async function deletePostFromFirestore(
  blogId: string,
  category: string,
  postId: string
): Promise<void> {
  try {
    const postRef = doc(db, blogId, 'posts', category, postId);
    await deleteDoc(postRef);
    console.log('✅ Firestore 포스트 삭제 완료:', postId);
  } catch (error) {
    console.error('❌ Firestore 포스트 삭제 실패:', error);
    throw error;
  }
}

/**
 * 포스트 카테고리 변경 (기존 글 삭제 후 새 카테고리에 저장)
 */
export async function changePostCategory(
  blogId: string,
  oldCategory: string,
  newCategory: string,
  postId: string
): Promise<void> {
  try {
    // 1. 기존 포스트 데이터 가져오기
    const oldPostRef = doc(db, blogId, 'posts', oldCategory, postId);
    const oldPostSnap = await getDoc(oldPostRef);

    if (!oldPostSnap.exists()) {
      throw new Error('포스트를 찾을 수 없습니다.');
    }

    const postData = oldPostSnap.data();

    // 2. 새 카테고리에 포스트 저장 (카테고리 필드도 업데이트)
    const newPostRef = doc(db, blogId, 'posts', newCategory, postId);
    await setDoc(newPostRef, {
      ...postData,
      categories: [newCategory], // 카테고리 업데이트
      updatedAt: Timestamp.now()
    });

    // 3. 기존 포스트 삭제
    await deleteDoc(oldPostRef);

    console.log('✅ 포스트 카테고리 변경 완료:', postId, oldCategory, '→', newCategory);
  } catch (error) {
    console.error('❌ 포스트 카테고리 변경 실패:', error);
    throw error;
  }
}

/**
 * 모든 블로그 목록 가져오기 (Firebase에서 동적 감지)
 */
export async function getAllBlogs(): Promise<{ blogId: string, displayName: string }[]> {
  try {
    console.log('🔍 blogs 컬렉션 조회 시작');

    // blogs 컬렉션에서 모든 블로그 조회
    console.log('🔗 Firebase 연결 상태:', db ? 'OK' : 'FAIL');
    const blogsSnapshot = await getDocs(collection(db, 'blogs'));
    console.log('📊 blogs 컬렉션 문서 수:', blogsSnapshot.size);
    console.log('📁 발견된 문서 ID들:', blogsSnapshot.docs.map(doc => doc.id));

    // 직접 axi 문서 접근 테스트
    try {
      const axiDoc = await getDoc(doc(db, 'blogs', 'axi'));
      console.log('🧪 axi 문서 직접 접근:', axiDoc.exists());
    } catch (error) {
      console.error('❌ axi 문서 직접 접근 실패:', error);
    }

    const blogs: { blogId: string, displayName: string }[] = [];

    for (const blogDoc of blogsSnapshot.docs) {
      const blogId = blogDoc.id;
      console.log(`🔍 블로그 ${blogId} 설정 확인 중...`);

      try {
        // settings 문서 확인
        const settingsRef = doc(db, 'blogs', blogId, 'data', 'settings');
        const settingsSnap = await getDoc(settingsRef);

        console.log(`📋 ${blogId}/data/settings 존재:`, settingsSnap.exists());

        // settings가 없어도 블로그는 추가 (기본값 사용)
        const blog = {
          blogId,
          displayName: getDisplayName(blogId)
        };
        blogs.push(blog);
        console.log(`✅ 블로그 추가됨:`, blog);
      } catch (error) {
        console.warn(`❌ 블로그 ${blogId} 설정 확인 실패:`, error);
      }
    }

    console.log('🎯 최종 블로그 목록:', blogs);
    return blogs;
  } catch (error) {
    console.error('❌ 블로그 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 블로그 ID에 따른 표시 이름 생성
 */
function getDisplayName(blogId: string): string {
  return blogId;
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

