import { db } from './config';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp, setDoc, startAfter, limit, deleteDoc, collectionGroup } from 'firebase/firestore';
import { Post, PostStatus } from '@/types/index';
import { getCurrentUser } from './auth';

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
    langType?: string;
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

    // 현재 로그인한 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid || currentUser?.email || 'system';

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
      updatedAt: null, // 처음 등록 시 null
      publishedAt: metadata.status === 'published' ? timestamp : null,
      scheduledAt: null,
      slug: generateSlug(title),
      authorId: userId,
      featuredImage: extractFirstImage(content),
      readingTime: Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200),
      viewCount: 0,
      createUser: userId, // 생성 사용자
      updateUser: null, // 처음 등록 시 null
      seo: {
        metaTitle: metadata.metaTitle || title,
        metaDescription: metadata.metaDescription || generateExcerpt(content),
        keywords: metadata.keywords || [],
        ogImage: extractFirstImage(content),
      },
      ...(metadata.langType && { langType: metadata.langType }),
      ...(polls && polls.length > 0 && {
        polls: polls
      })
    } as any;

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
    // 현재 로그인한 사용자 정보 가져오기
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid || currentUser?.email || 'system';

    const postRef = doc(db, 'blogs', blogId, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: Timestamp.now(),
      updateUser: userId, // 수정 사용자만 업데이트
    });
    console.log('✅ Firestore 포스트 업데이트 완료:', postId);
  } catch (error) {
    console.error('❌ Firestore 포스트 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 특정 블로그의 전체 포스트 목록 가져오기 (필터링 지원)
 * 색인: CICAgNiav4AK 사용
 */
export async function getPostListByBlog(
  blogId: string,
  pageSize: number = 10,
  lastPostId?: string,
  filters?: {
    category?: string;
    status?: string;
    langType?: string;
    searchTerm?: string;
  }
): Promise<{ posts: Post[], hasMore: boolean }> {
  try {
    // 모든 필터 조합에 대한 복합 색인 생성 완료
    // Firebase가 쿼리 패턴에 맞는 색인을 자동 선택

    const queryConstraints: any[] = [
      where('blogId', '==', blogId)
    ];

    console.log("filters", filters)

    // 각 필터를 독립적으로 추가 (색인이 모든 조합을 커버)
    if (filters?.category && filters.category !== 'all' && filters.category.trim() !== '') {
      queryConstraints.push(where('categories', 'array-contains', filters.category));
    }

    if (filters?.langType && filters.langType !== 'all' && filters.langType.trim() !== '') {
      queryConstraints.push(where('langType', '==', filters.langType));
    }

    if (filters?.status && filters.status !== 'all' && filters.status.trim() !== '') {
      queryConstraints.push(where('status', '==', filters.status));
    }

    // 생성일 기준 내림차순 정렬 (색인과 일치)
    queryConstraints.push(orderBy('createdAt', 'desc'));

    // 페이징 처리
    if (lastPostId) {
      const lastDoc = await getDoc(doc(db, 'blogs', blogId, 'posts', lastPostId));
      if (lastDoc.exists()) {
        queryConstraints.push(startAfter(lastDoc));
      }
    }

    queryConstraints.push(limit(pageSize + 1));

    // 쿼리 실행
    const q = query(collectionGroup(db, 'posts'), ...queryConstraints);
    const querySnapshot = await getDocs(q);

    let posts: Post[] = [];
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      } as Post);
    });

    // 검색어 필터링 (클라이언트 측 - Firebase 전문 검색 미지원)
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower)
      );
    }

    const hasMore = posts.length > pageSize;
    if (hasMore) {
      posts.pop();
    }

    console.log(`✅ ${blogId} 포스트 ${posts.length}개 조회 (필터 적용)`);
    return { posts, hasMore };
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

export interface Category {
  categoryId: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  status: 'Y' | 'N';
  createdAt?: Date | Timestamp;
  createUser?: string;
  updatedAt?: Date | Timestamp;
  updateUser?: string;
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
      const now = Timestamp.now();

      // categoryId가 없는 기존 데이터에 순차 번호 자동 생성
      let nextId = 1;
      const categories = Array.isArray(data.categories)
        ? data.categories.map((cat: any) => {
            let categoryId = cat.categoryId;

            // categoryId가 없으면 순차 번호 생성
            if (!categoryId) {
              categoryId = nextId.toString().padStart(3, '0'); // 001, 002, ...
              nextId++;
            }

            return {
              ...cat,
              categoryId,
              // 생성/수정 정보가 없는 기존 데이터에 기본값 설정
              createdAt: cat.createdAt || now,
              createUser: cat.createUser || cat.createdBy || 'system',
              updatedAt: cat.updatedAt || now,
              updateUser: cat.updateUser || cat.updatedBy || 'system'
            };
          })
        : [];
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
  const now = Timestamp.now();
  const currentUser = getCurrentUser();
  const systemUser = currentUser?.uid || currentUser?.email || 'system';

  switch (blogId) {
    case 'axi':
      return {
        categories: [
          { categoryId: '001', nameKo: '시장 분석', nameEn: 'Market Analysis', descriptionKo: '금융 시장 동향 및 분석', descriptionEn: 'Financial market trends and analysis', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '002', nameKo: '거래 전략', nameEn: 'Trading Strategy', descriptionKo: '효과적인 거래 전략 및 팁', descriptionEn: 'Effective trading strategies and tips', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '003', nameKo: '경제 뉴스', nameEn: 'Economic News', descriptionKo: '주요 경제 뉴스 및 이슈', descriptionEn: 'Major economic news and issues', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '004', nameKo: '테크니컬 분석', nameEn: 'Technical Analysis', descriptionKo: '차트 및 기술적 분석', descriptionEn: 'Chart and technical analysis', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '005', nameKo: '투자 팁', nameEn: 'Investment Tips', descriptionKo: '투자 관련 유용한 정보', descriptionEn: 'Useful investment information', status: 'Y', createdAt: now, createUser: systemUser }
        ],
        design: getDefaultDesignSettings('axi')
      };
    case 'orbisLanding':
      return {
        categories: [
          { categoryId: '001', nameKo: '회사 소식', nameEn: 'Company News', descriptionKo: '회사의 최신 소식', descriptionEn: 'Latest company news', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '002', nameKo: '제품 업데이트', nameEn: 'Product Updates', descriptionKo: '제품 업데이트 및 새로운 기능', descriptionEn: 'Product updates and new features', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '003', nameKo: '고객 사례', nameEn: 'Customer Stories', descriptionKo: '고객 성공 사례', descriptionEn: 'Customer success stories', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '004', nameKo: '기술 블로그', nameEn: 'Tech Blog', descriptionKo: '기술 관련 인사이트', descriptionEn: 'Technology insights', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '005', nameKo: '이벤트', nameEn: 'Events', descriptionKo: '이벤트 및 행사 정보', descriptionEn: 'Event information', status: 'Y', createdAt: now, createUser: systemUser }
        ],
        design: getDefaultDesignSettings('orbisLanding')
      };
    default:
      return {
        categories: [
          { categoryId: '001', nameKo: '일반', nameEn: 'General', descriptionKo: '일반 게시물', descriptionEn: 'General posts', status: 'Y', createdAt: now, createUser: systemUser },
          { categoryId: '002', nameKo: '공지사항', nameEn: 'Announcements', descriptionKo: '중요 공지사항', descriptionEn: 'Important announcements', status: 'Y', createdAt: now, createUser: systemUser }
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
 * 최적화: 불필요한 settings 조회 제거하여 Firebase 호출 최소화
 */
export async function getAllBlogs(): Promise<{ blogId: string, displayName: string }[]> {
  try {
    console.log('🔍 blogs 컬렉션 조회 시작');

    // blogs 컬렉션에서 모든 블로그 조회 (단일 쿼리)
    const blogsSnapshot = await getDocs(collection(db, 'blogs'));
    console.log('📊 blogs 컬렉션 문서 수:', blogsSnapshot.size);

    // 불필요한 settings 조회 제거 - displayName만 필요하므로 별도 쿼리 불필요
    const blogs = blogsSnapshot.docs.map(doc => ({
      blogId: doc.id,
      displayName: getDisplayName(doc.id)
    }));

    console.log('✅ 블로그 목록 조회 완료 (단일 쿼리):', blogs);
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

