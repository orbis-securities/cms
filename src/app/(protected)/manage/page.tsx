"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Edit,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Calendar,
  Tag,
  Users
} from 'lucide-react';
import { getPostsByBlog, getAllPostsByBlog, getPostsByCategory, getBlogSettings, deletePostFromFirestore, getAllBlogs } from '@/lib/firebase/posts';
import { Post } from '@/types';
import { toast, Toaster } from 'sonner';

export default function ManagePosts() {
  const [selectedBlog, setSelectedBlog] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBlogs, setAvailableBlogs] = useState<{ blogId: string, displayName: string }[]>([]);

  const postsPerPage = 10;

  // 블로그 목록 로드
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const blogs = await getAllBlogs();
        setAvailableBlogs(blogs);
      } catch (error) {
        console.error('블로그 목록 로드 실패:', error);
      }
    };

    loadBlogs();
  }, []);

  // 블로그 선택 시 카테고리 불러오기
  useEffect(() => {
    const loadBlogSettings = async () => {
      if (selectedBlog) {
        try {
          const settings = await getBlogSettings(selectedBlog);
          if (settings) {
            setAvailableCategories(settings.categories);
          }
        } catch (error) {
          console.error('블로그 설정 로드 실패:', error);
        }
      } else {
        setAvailableCategories([]);
        setSelectedCategory('');
      }
    };

    loadBlogSettings();
  }, [selectedBlog]);

  // 포스트 검색
  const handleSearch = async () => {
    console.log('🔍 검색 시작:', { selectedBlog, selectedCategory, selectedStatus });

    if (!selectedBlog) {
      alert('먼저 블로그를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      let result;

      if (selectedCategory) {
        // 카테고리별 조회
        console.log('📂 카테고리별 조회:', selectedBlog, selectedCategory);
        const categoryResult = await getPostsByCategory(selectedBlog, selectedCategory, postsPerPage);
        console.log('📊 카테고리 조회 결과:', categoryResult);
        result = categoryResult;
      } else {
        // 전체 포스트 조회
        console.log('🌐 전체 포스트 조회:', selectedBlog);
        const blogResult = await getPostsByBlog(selectedBlog, postsPerPage);
        console.log('📊 전체 조회 결과:', blogResult);
        result = blogResult;
      }

      let filteredPosts = result.posts;

      // 상태별 필터링
      if (selectedStatus !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.status === selectedStatus);
      }

      // 검색어 필터링
      if (searchTerm) {
        filteredPosts = filteredPosts.filter(post =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setPosts(filteredPosts);
      setHasMore(result.hasMore);
      setCurrentPage(1);
    } catch (error) {
      console.error('포스트 검색 실패:', error);
      alert('포스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터 초기화
  const resetFilters = () => {
    setSelectedBlog('');
    setSelectedCategory('');
    setSelectedStatus('all');
    setSearchTerm('');
    setPosts([]);
    setCurrentPage(1);
    setHasMore(false);
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 포스트 삭제
  const handleDeletePost = async (post: Post) => {
    // 첫 번째 확인
    if (!confirm(`정말로 "${post.title}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    // 두 번째 확인 (ID 입력)
    const userInput = prompt(`삭제를 확인하려면 포스트 ID를 입력하세요:\n\n포스트 ID: ${post.id}`);
    if (userInput !== post.id) {
      toast.error('포스트 ID가 일치하지 않습니다. 삭제가 취소되었습니다.');
      return;
    }

    try {
      await deletePostFromFirestore(selectedBlog, post.categories[0], post.id);
      toast.success('포스트가 삭제되었습니다.');

      // 목록에서 제거
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
      toast.error('포스트 삭제에 실패했습니다.');
    }
  };

  // 상태 표시
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">발행됨</span>;
      case 'draft':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">초안</span>;
      default:
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">검색 필터</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* 블로그 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">블로그 선택 *</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={selectedBlog}
                onChange={(e) => setSelectedBlog(e.target.value)}
                disabled={availableBlogs.length === 0}
              >
                {availableBlogs.length === 0 ? (
                  <option value="">블로그 로딩 중...</option>
                ) : (
                  <>
                    <option value="">블로그를 선택하세요</option>
                    {availableBlogs.map((blog) => (
                      <option key={blog.blogId} value={blog.blogId}>
                        {blog.displayName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">카테고리</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={!selectedBlog || availableCategories.length === 0}
              >
                <option value="">전체 카테고리</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 선택 */}
            <div>
              <label className="block text-sm font-medium mb-2">상태</label>
              <select
                className="w-full px-3 py-2 border rounded-lg"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">전체 상태</option>
                <option value="published">발행됨</option>
                <option value="draft">초안</option>
              </select>
            </div>

            {/* 검색어 */}
            <div>
              <label className="block text-sm font-medium mb-2">검색어</label>
              <input
                type="text"
                placeholder="제목 또는 내용 검색"
                className="w-full px-3 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              disabled={!selectedBlog || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? '검색 중...' : '검색'}
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 검색 안내 메시지 */}
        {posts.length === 0 && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              포스트를 검색해보세요
            </h3>
            <p className="text-blue-700">
              위의 필터에서 블로그를 선택한 후 검색 버튼을 눌러주세요
            </p>
          </div>
        )}

        {/* 포스트 리스트 */}
        {posts.length > 0 && (
          <div className="bg-white rounded-lg border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                검색 결과 ({posts.length}개)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/manage/${post.id}?blog=${selectedBlog}&category=${post.categories[0]}`}
                          className="block hover:text-blue-600 transition-colors"
                        >
                          <div className="font-medium text-gray-900 truncate max-w-xs">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {post.excerpt || '내용 없음'}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {post.categories?.[0] || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(post.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(post.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/manage/${post.id}?blog=${selectedBlog}&category=${post.categories[0]}`}
                            className="text-gray-600 hover:text-gray-800"
                            title="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/write?id=${post.id}&category=${post.categories[0]}&blog=${selectedBlog}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="수정"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeletePost(post)}
                            className="text-red-600 hover:text-red-800"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {posts.length >= postsPerPage && (
              <div className="p-6 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {posts.length}개 결과 표시
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm">
                    페이지 {currentPage}
                  </span>
                  <button
                    disabled={!hasMore}
                    className="px-3 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!loading && posts.length === 0 && selectedBlog && (
          <div className="bg-white rounded-lg border p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">
              다른 조건으로 검색해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}