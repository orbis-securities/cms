"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users
} from 'lucide-react';
import { getPostListByBlog, getBlogSettings, getAllBlogs, Category } from '@/lib/firebase/posts';
import { Post } from '@/types';

export default function ManagePosts() {
  const [selectedBlog, setSelectedBlog] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [availableBlogs, setAvailableBlogs] = useState<{ blogId: string, displayName: string }[]>([]);

  const postsPerPage = 10;

  // 블로그 목록 로드
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const blogs = await getAllBlogs();
        setAvailableBlogs(blogs);

        // 첫 번째 블로그 자동 선택
        if (blogs.length > 0) {
          setSelectedBlog(blogs[0].blogId);
        }
      } catch (error) {
        console.error('블로그 목록 로드 실패:', error);
      }
    };

    loadBlogs();
  }, []);

  // 블로그 선택 시 카테고리 불러오기 및 자동 검색 (병렬 처리)
  useEffect(() => {
    const loadBlogData = async () => {
      if (selectedBlog && selectedBlog !== 'all') {
        setLoading(true);
        try {
          // 카테고리 정보와 포스트 목록을 병렬로 로드
          const [settings, result] = await Promise.all([
            getBlogSettings(selectedBlog),
            getPostListByBlog(selectedBlog, postsPerPage, undefined, {
              category: selectedCategory.trim() || undefined,
              status: selectedStatus.trim() || undefined,
              langType: selectedLanguage.trim() || undefined,
              searchTerm: searchTerm.trim() || undefined
            })
          ]);

          // 카테고리 정보 설정
          if (settings) {
            setAvailableCategories(settings.categories);
          }

          // 포스트 목록 설정
          setPosts(result.posts);
          setHasMore(result.hasMore);
          setCurrentPage(1);
        } catch (error) {
          console.error('데이터 로드 실패:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setAvailableCategories([]);
        setSelectedCategory('');
        setPosts([]);
      }
    };

    loadBlogData();
  }, [selectedBlog]);

  // 포스트 검색
  const handleSearch = async () => {
    console.log('🔍 검색 시작:', { selectedBlog, selectedCategory, selectedStatus, selectedLanguage, searchTerm });

    if (!selectedBlog) {
      alert('먼저 블로그를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Firebase 쿼리에 필터 조건 전달 (빈 문자열은 undefined로 변환)
      const result = await getPostListByBlog(selectedBlog, postsPerPage, undefined, {
        category: selectedCategory.trim() || undefined,
        status: selectedStatus.trim() || undefined,
        langType: selectedLanguage.trim() || undefined,
        searchTerm: searchTerm.trim() || undefined
      });

      console.log('📊 필터링된 조회 결과:', result);

      setPosts(result.posts);
      setHasMore(result.hasMore);
      setCurrentPage(1);
    } catch (error) {
      console.error('포스트 검색 실패:', error);
      alert('포스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId: string) => {
    const category = availableCategories.find(cat => cat.categoryId === categoryId);
    if (category) {
      return `${category.nameKo} / ${category.nameEn}`;
    }
    return categoryId;
  };

  // 상태 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '발행됨';
      case 'draft':
        return '초안';
      default:
        return status;
    }
  };

  // 언어 텍스트
  const getLanguageText = (langType?: string) => {
    switch (langType) {
      case 'ko':
        return '한국어';
      case 'en':
        return '영어';
      default:
        return langType || '-';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              메인으로
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  포스트 관리
                </h1>
                <p className="text-sm text-gray-500">
                  작성된 포스트를 확인하고 관리하세요
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-5 h-5" />
            내 정보
          </Link>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-5 py-6">

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
            {/* 블로그 선택 - 2 */}
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">블로그 *</label>
              <select
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                value={selectedBlog}
                onChange={(e) => setSelectedBlog(e.target.value)}
                disabled={availableBlogs.length === 0}
              >
                {availableBlogs.length === 0 ? (
                  <option value="">블로그 로딩 중...</option>
                ) : (
                  <>
                    <option value="all">블로그 선택</option>
                    {availableBlogs.map((blog) => (
                      <option key={blog.blogId} value={blog.blogId}>
                        {blog.displayName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* 카테고리 선택 - 2 */}
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!selectedBlog || availableCategories.length === 0}
              >
                <option value="all">카테고리 선택</option>
                {availableCategories
                  .filter(category => category.status === 'Y')
                  .map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.nameKo}
                    </option>
                  ))}
              </select>
            </div>

            {/* 언어 선택 - 1 */}
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
              <select
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="all">언어 선택</option>
                <option value="ko">한국어</option>
                <option value="en">영어</option>
              </select>
            </div>

            {/* 상태 선택 - 1 */}
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">상태 선택</option>
                <option value="published">발행됨</option>
                <option value="draft">초안</option>
              </select>
            </div>

            {/* 검색어 - 3 */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">검색어</label>
              <input
                type="text"
                placeholder="제목 또는 내용 검색"
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* 검색 버튼 - 1 */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <button
                onClick={handleSearch}
                disabled={!selectedBlog || loading}
                className="w-full h-10 px-3 sm:px-4 bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                {loading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>
        </div>

        {/* 포스트 리스트 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">포스트 목록을 불러오는 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="w-full min-w-[640px] border-collapse border-hidden">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">제목</th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">카테고리(ko/en)</th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">언어</th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">상태</th>
                    <th className="px-3 sm:px-6 py-3 text-center text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">생성일</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.length > 0 ? (
                    posts.map((post) => (
                      <tr key={post.id} className="h-16 hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4">
                        <Link
                          href={`/manage/${post.id}?blog=${selectedBlog}&category=${post.categories[0]}`}
                          className="block hover:text-blue-600 transition-colors"
                        >
                          <div className="font-medium text-gray-900 truncate max-w-2xl">
                            {post.title}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {getCategoryName(post.categories?.[0] || '')}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {getLanguageText(post.langType)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center">
                        <div className="text-xs sm:text-sm text-gray-900">
                          {getStatusText(post.status)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </td>
                    </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}