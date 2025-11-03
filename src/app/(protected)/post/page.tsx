"use client";

import { useState, useEffect, useMemo } from 'react';
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
import Button from '@/components/common/Button';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const postsPerPage = 10;

  // 검색 조건이 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    sessionStorage.setItem('manage_selectedBlog', selectedBlog);
  }, [selectedBlog]);

  useEffect(() => {
    sessionStorage.setItem('manage_selectedCategory', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    sessionStorage.setItem('manage_selectedStatus', selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    sessionStorage.setItem('manage_selectedLanguage', selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    sessionStorage.setItem('manage_searchKeyword', searchKeyword);
  }, [searchKeyword]);

  useEffect(() => {
    if (posts.length > 0) {
      sessionStorage.setItem('manage_posts', JSON.stringify(posts));
    }
  }, [posts]);

  // 초기 로드 시 검색 실행
  useEffect(() => {
    if (selectedBlog) {
      handleSearch();
    }
  }, []); // 빈 배열로 마운트 시 한 번만 실행

  // 포스트 검색
  const handleSearch = async () => {
    if (!selectedBlog) {
      alert('먼저 블로그를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({
        blogId: selectedBlog,
      });

      if (selectedCategory.trim()) params.append('categoryId', selectedCategory.trim());
      if (selectedStatus.trim()) params.append('status', selectedStatus.trim());
      if (selectedLanguage.trim()) params.append('langType', selectedLanguage.trim());
      if (searchKeyword.trim()) params.append('searchKeyword', searchKeyword.trim());

      const response = await fetch(`https://onfwfuixsubpwftdwqea.supabase.co/functions/v1/getPosts?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.code === "S" && data.result) {
        const postsArray = data.result.posts || [];
        setPosts(postsArray);
        setHasMore(data.result.hasMore || false);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('포스트 검색 실패:', error);
      alert('포스트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인기 게시글 토글
  const handleToggleFeatured = async (post: Post) => {
    try {
      const token = localStorage.getItem('authToken');

      // popularYn이 'Y'이면 제거, 아니면 추가
      if (post.popularYn === 'Y') {
        // 인기 게시글 제거
        const response = await fetch('https://onfwfuixsubpwftdwqea.supabase.co/functions/v1/removePopularPost', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            postId: post.postId,
          }),
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
        const response = await fetch('https://onfwfuixsubpwftdwqea.supabase.co/functions/v1/addPopularPost', {
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
  };

  // AG Grid 컬럼 정의
  const columnDefs = useMemo<ColDef<Post>[]>(() => [
    {
      field: 'popularYn',
      headerName: '인기',
      width: 100,
      sortable: true,
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
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' }
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
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' }
    },
    {
      field: 'statusNm',
      headerName: '상태',
      width: 120,
      sortable: true,
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' }
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      width: 180,
      sortable: true,
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' }
    },
  ], [selectedBlog]);

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
            <label className="block text-sm font-medium text-gray-700 mb-2">블로그 *</label>
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
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* 검색 버튼 - 1 */}
          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <Button
              onClick={handleSearch}
              disabled={!selectedBlog || loading}
              variant="primary"
              loading={loading}
              className="w-full h-10 justify-center"
            >
              {loading ? '검색 중...' : '검색'}
            </Button>
          </div>
        </div>
      </div>

      {/* AG Grid 테이블 */}
      <div className="grid-container">
          <div className="ag-theme-material compact-grid" style={{ height: 'calc(100vh - 280px)', width: '100%' }}>
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

      {/* 안내 메시지 */}
      <div className="mt-2">
        <p className="text-xs text-gray-500">
          ℹ️ 인기 게시글은 언어별로 최대 3개씩 설정할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
