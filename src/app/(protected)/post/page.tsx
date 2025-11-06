"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { Post } from '@/types';
import CommonCodeSelect from '@/components/common/CommonCodeSelect';
import CategorySelect from '@/components/common/CategorySelect';
import { toast } from 'sonner';

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ManagePosts() {
  // sessionStorage에서 검색 조건 복원
  const [selectedBlog, setSelectedBlog] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manage_selectedBlog') || '';
    }
    return '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manage_selectedCategory') || '';
    }
    return '';
  });
  const [selectedStatus, setSelectedStatus] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manage_selectedStatus') || 'published';
    }
    return 'published';
  });
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manage_selectedLanguage') || '';
    }
    return '';
  });
  const [searchKeyword, setSearchKeyword] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manage_searchKeyword') || '';
    }
    return '';
  });
  const [isMine, setIsMine] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manage_isMine') === 'true';
    }
    return false;
  });
  const [isAutomated, setIsAutomated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('manage_isAutomated') === 'true';
    }
    return false;
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const postsPerPage = 20;

  // 검색 조건이 변경될 때마다 sessionStorage에 저장 (combined for performance)
  useEffect(() => {
    sessionStorage.setItem('manage_selectedBlog', selectedBlog);
    sessionStorage.setItem('manage_selectedCategory', selectedCategory);
    sessionStorage.setItem('manage_selectedStatus', selectedStatus);
    sessionStorage.setItem('manage_selectedLanguage', selectedLanguage);
    sessionStorage.setItem('manage_searchKeyword', searchKeyword);
    sessionStorage.setItem('manage_isMine', isMine.toString());
    sessionStorage.setItem('manage_isAutomated', isAutomated.toString());
  }, [selectedBlog, selectedCategory, selectedStatus, selectedLanguage, searchKeyword, isMine, isAutomated]);

  useEffect(() => {
    if (posts.length > 0) {
      sessionStorage.setItem('manage_posts', JSON.stringify(posts));
    }
  }, [posts]);

  // 초기 로드 시 검색 실행
  useEffect(() => {
    handleSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 빈 배열로 마운트 시 한 번만 실행

  // 체크박스 변경 시 자동 검색
  useEffect(() => {
    handleSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMine, isAutomated]);

  // 포스트 검색
  const handleSearch = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: postsPerPage.toString(),
      });

      if (selectedBlog.trim()) params.append('blogId', selectedBlog.trim());
      if (selectedCategory.trim()) params.append('categoryId', selectedCategory.trim());
      if (selectedStatus.trim()) params.append('status', selectedStatus.trim());
      if (selectedLanguage.trim()) params.append('langType', selectedLanguage.trim());
      if (searchKeyword.trim()) params.append('searchKeyword', searchKeyword.trim());

      // 체크박스는 항상 값 전송
      params.append('isMine', isMine.toString());
      params.append('isAutomated', (!isAutomated).toString()); // 자동화 제외 체크 시 false

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/getPosts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.code === "S" && data.result) {
        const postsArray = data.result.posts || [];
        setPosts(postsArray);

        // pagination 객체에서 정보 추출
        if (data.result.pagination) {
          setTotalCount(data.result.pagination.total || 0);
          setCurrentPage(data.result.pagination.page || page);
        } else {
          setTotalCount(0);
          setCurrentPage(page);
        }
      }
    } catch (error) {
      console.error('포스트 검색 실패:', error);
      alert('포스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [selectedBlog, selectedCategory, selectedStatus, selectedLanguage, searchKeyword, isMine, isAutomated]);

  // 인기 게시글 토글
  const handleToggleFeatured = useCallback(async (post: Post) => {
    try {
      const token = localStorage.getItem('authToken');

      // popularYn이 'Y'이면 제거, 아니면 추가
      if (post.popularYn === 'Y') {
        // 인기 게시글 제거
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/removePopularPost?postId=${post.postId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.code === "S") {
          // 목록 업데이트
          setPosts(prevPosts =>
            prevPosts.map(p =>
              p.postId === post.postId ? { ...p, popularYn: 'N' } : p
            )
          );

          toast.success('인기 게시글에서 제거되었습니다.');
        } else {
          toast.error(data.message || '인기 게시글 제거에 실패했습니다.');
        }
      } else {
        // 인기 게시글 추가
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/addPopularPost`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            blogId: post.blogId,
            postId: post.postId,
            langType: post.langType,
          }),
        });

        const data = await response.json();

        if (data.code === "S") {
          // 목록 업데이트
          setPosts(prevPosts =>
            prevPosts.map(p =>
              p.postId === post.postId ? { ...p, popularYn: 'Y' } : p
            )
          );

          toast.success('인기 게시글로 등록되었습니다.');
        } else {
          toast.error(data.message || '인기 게시글 등록에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('인기 게시글 설정 실패:', error);
      toast.error('인기 게시글 설정에 실패했습니다.');
    }
  }, []);

  // AG Grid 컬럼 정의
  const columnDefs = useMemo<ColDef<Post>[]>(() => [
    {
      field: 'popularYn',
      headerName: '인기',
      width: 100,
      sortable: true,
      cellClass: 'ag-cell-center',
      cellRenderer: (params: any) => (
        <div className="flex items-center justify-center h-full">
          <button
            onClick={() => handleToggleFeatured(params.data)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            title={params.data.popularYn === 'Y' ? '인기 게시글에서 제거' : '인기 게시글로 등록'}
          >
            <Star
              className={`w-5 h-5 ${
                params.data.popularYn === 'Y'
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        </div>
      ),
      comparator: (valueA, valueB) => {
        const aValue = valueA === 'Y' ? 1 : 0;
        const bValue = valueB === 'Y' ? 1 : 0;
        return aValue - bValue;
      },
    },
    {
      field: 'blogNm',
      headerName: '블로그',
      minWidth: 80,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'title',
      headerName: '제목',
      flex: 1,
      minWidth: 300,
      sortable: true,
      cellRenderer: (params: any) => {
        const handleClick = () => {
          // 상세 페이지로 전달할 데이터를 sessionStorage에 저장
          sessionStorage.setItem('postDetailData', JSON.stringify({
            postId: params.data.postId,
          }));
        };

        return (
          <Link
            href={`/post/${params.data.slug}`}
            onClick={handleClick}
            className="block hover:text-blue-600 transition-colors truncate font-medium"
          >
            {params.value}
          </Link>
        );
      },
    },
    {
      field: 'categoryNm',
      headerName: '카테고리',
      width: 150,
      sortable: true
    },
    {
      field: 'langTypeNm',
      headerName: '언어',
      width: 100,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'statusNm',
      headerName: '상태',
      width: 120,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      width: 180,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
  ], [handleToggleFeatured]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
  }), []);

  return (
    <div className="max-w-screen-2xl mx-auto px-5 py-6">
      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* 블로그 선택 - 2 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">블로그</label>
            <CommonCodeSelect
              groupCode="BLOG_ID"
              value={selectedBlog}
              onChange={setSelectedBlog}
              allLabel="블로그 선택"
            />
          </div>

          {/* 카테고리 선택 - 2 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
            <CategorySelect
              blogId={selectedBlog}
              value={selectedCategory}
              onChange={setSelectedCategory}
              allLabel="카테고리 선택"
            />
          </div>

          {/* 언어 선택 - 1 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">언어</label>
            <CommonCodeSelect
              groupCode="LANG"
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              allLabel="언어 선택"
            />
          </div>

          {/* 상태 선택 - 1 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <CommonCodeSelect
              groupCode="STATUS"
              value={selectedStatus}
              onChange={setSelectedStatus}
              allLabel="상태 선택"
            />
          </div>

          {/* 검색어 - 3 */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">검색어</label>
            <input
              type="text"
              placeholder="제목 또는 내용 검색"
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
            />
          </div>

          {/* 검색 버튼 - 1 */}
          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <button
              onClick={() => handleSearch(1)}
              disabled={loading}
              className="w-full h-10 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>
      </div>

      {/* 필터 체크박스 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isMine}
              onChange={(e) => setIsMine(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">내가 쓴 글만 보기</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAutomated}
              onChange={(e) => setIsAutomated(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">자동화 제외</span>
          </label>
        </div>
      </div>

      {/* AG Grid 테이블 */}
      <div className="grid-container">
          <div className="ag-theme-material compact-grid" style={{ height: 'calc(100vh - 400px)', width: '100%' }}>
            <AgGridReact
              rowData={posts}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              theme="legacy"
              animateRows={true}
              rowHeight={50}
              headerHeight={55}
              suppressCellFocus={true}
              domLayout="normal"
            />
          </div>
      </div>

      {/* 페이징 UI */}
      {posts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              총 {totalCount.toLocaleString()}개 중 {((currentPage - 1) * postsPerPage) + 1}-{Math.min(currentPage * postsPerPage, totalCount)}개 표시
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSearch(1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                처음
              </button>
              <button
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-sm font-medium">
                {currentPage} / {Math.ceil(totalCount / postsPerPage)}
              </span>
              <button
                onClick={() => handleSearch(currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalCount / postsPerPage) || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
              <button
                onClick={() => handleSearch(Math.ceil(totalCount / postsPerPage))}
                disabled={currentPage >= Math.ceil(totalCount / postsPerPage) || loading}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                마지막
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
