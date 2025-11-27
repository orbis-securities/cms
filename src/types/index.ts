// 블로그 데이터 타입 정의

// Post Status 타입
export type PostStatus = 'draft' | 'published' | 'scheduled';

export interface Blog {
  id: string;
  name: string;
  domain: string;
  description: string;
  logo: string;
  favicon: string;
  theme: BlogTheme;
  seoSettings: SEOSettings;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isActive: boolean;
}

export interface BlogTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerLayout: 'centered' | 'left' | 'right';
  fontFamily: string;
  customCSS?: string;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage: string;
  twitterCard: 'summary' | 'summary_large_image';
  structuredData?: Record<string, unknown>;
  analytics?: {
    googleAnalyticsId?: string;
    googleTagManagerId?: string;
  };
}

export interface PostPoll {
  pollId: string;
  pollType: string;
  question: string;
  options: { text: string; votes: number }[];
  allowMultiple: boolean;
  totalVotes: number;
}

export interface Post {
  postId: string;
  blogId: string;
  blogNm?: string;
  title: string;
  description?: string;
  slug: string;
  content: string;
  featuredImage: string | null;
  status: string;
  statusNm: string;
  categoryId: string;
  categoryNm?: string;
  tags: string;
  seo: PostSEO;
  viewCount: number;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  createdBy?: string;
  createdNm?: string;
  updatedBy?: string;
  updatedNm?: string;
  publishedBy?: string;
  publishedNm?: string;
  polls?: PostPoll[];
  langType: string;
  langTypeNm?: string;
  popularYn?: string;
}

export interface PostSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string | null;
  ogTitle?: string;
  ogDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

// 블로그 카테고리 (기존)
export interface BlogCategory {
  id: string;
  blogId: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  parentId?: string;
  postCount: number;
  seo: {
    metaTitle?: string;
    metaDescription?: string;
  };
  createdAt: string;
}

// 카테고리 관리 페이지용 타입
export interface Category {
  blogId: string;
  blogNm?: string;
  categoryId: string;
  name: string;
  path: string;
  sortOrder: number;
  useYn: string;
  useYnNm?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

// 블로그 디자인 설정
export interface BlogDesignSettings {
  fontFamily: string;
  heading: { fontSize: string; color: string };
  subheading: { fontSize: string; color: string };
  list: { fontSize: string; color: string };
  highlight: { fontSize: string; color: string };
  description: { fontSize: string; color: string };
  textTone: string;
}

// 템플릿 타입
export interface Template {
  templateId: string;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

// 배너 타입
export interface Banner {
  blogId: string;
  blogNm?: string;
  bannerId: string;
  bannerName: string;
  positionCode: string;
  positionCodeNm?: string;
  imageUrl: string;
  linkUrl: string;
  langType: string;
  langTypeNm?: string;
  viewOrder: number;
  useYn: string;
  useYnNm?: string;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Tag {
  id: string;
  blogId: string;
  name: string;
  slug: string;
  color: string;
  postCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'editor' | 'author';
  blogs: string[]; // 접근 가능한 블로그 ID 배열
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

export interface MediaFile {
  id: string;
  blogId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  uploadedBy: string;
  createdAt: string;
  usedIn: string[]; // 사용된 포스트 ID 배열
}

// Novel Editor에서 사용할 타입
export interface EditorContent {
  type: 'doc';
  content: Record<string, unknown>[];
}

// API Response 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 페이지네이션 타입
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}