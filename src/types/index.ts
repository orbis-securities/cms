// 블로그 데이터 타입 정의
import { Timestamp } from 'firebase/firestore';

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
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
  excerpt: string;
  featuredImage?: string | null;
  gallery?: string[];
  status: string;
  statusNm: string;
  publishedAt?: Timestamp | null;
  scheduledAt?: Timestamp | null;
  authorId: string;
  categories: string[];
  categoryNm?: string;
  tags: string[];
  seo: PostSEO;
  readingTime: number;
  viewCount: number;
  isFeatured?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp | null;
  createUser?: string;
  updateUser?: string | null;
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

export interface Category {
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
  createdAt: Timestamp;
}

export interface Tag {
  id: string;
  blogId: string;
  name: string;
  slug: string;
  color: string;
  postCount: number;
  createdAt: Timestamp;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'editor' | 'author';
  blogs: string[]; // 접근 가능한 블로그 ID 배열
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
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
  createdAt: Timestamp;
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