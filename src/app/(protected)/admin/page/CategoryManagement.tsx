"use client";

import { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { getBlogSettings, getAllBlogs, BlogDesignSettings, Category, saveBlogSettings } from '@/lib/firebase/posts';
import { toast } from 'sonner';
import CategoryModal, { CategoryData } from '../components/CategoryModal';

interface BlogConfig {
  blogId: string;
  categories: Category[];
  design: BlogDesignSettings;
}

export default function CategoryManagement() {
  const [blogs, setBlogs] = useState<BlogConfig[]>([]);
  const [loading, setLoading] = useState(false);

  // 필터링 상태
  const [selectedBlog, setSelectedBlog] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<CategoryData | null>(null);

  // 초기 블로그 목록 로드
  useEffect(() => {
    loadBlogs();
  }, []);

  // 블로그 목록 로드 후 첫 번째 블로그 자동 선택
  useEffect(() => {
    if (blogs.length > 0 && selectedBlog === '') {
      setSelectedBlog(blogs[0].blogId);
    }
  }, [blogs]);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      // Firebase에서 실제 존재하는 블로그들 찾기
      const existingBlogs = await getAllBlogs();
      const blogConfigs: BlogConfig[] = [];

      for (const blog of existingBlogs) {
        try {
          const settings = await getBlogSettings(blog.blogId);
          if (settings) {
            blogConfigs.push({
              blogId: blog.blogId,
              categories: settings.categories,
              design: settings.design || {
                fontFamily: 'Pretendard',
                heading: { fontSize: '28px', color: '#1F2937' },
                subheading: { fontSize: '22px', color: '#374151' },
                list: { fontSize: '16px', color: '#1F2937' },
                highlight: { fontSize: '16px', color: '#FBBF24' },
                description: { fontSize: '14px', color: '#6B7280' },
                textTone: 'professional'
              }
            });
          }
        } catch (error) {
          console.warn(`블로그 ${blog.blogId} 로드 실패:`, error);
        }
      }

      setBlogs(blogConfigs);
    } catch (error) {
      console.error('블로그 목록 로드 실패:', error);
      toast.error('블로그 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 블로그 목록 계산
  const filteredBlogs = useMemo(() => {
    return blogs.map(blog => {
      // 블로그 필터링
      if (selectedBlog && selectedBlog !== blog.blogId) {
        return null;
      }

      // 카테고리 필터링
      const filteredCategories = blog.categories.filter(category => {
        // 상태 필터링
        if (selectedStatus && category.status !== selectedStatus) {
          return false;
        }

        // 검색어 필터링 (name + description)
        if (searchKeyword) {
          const keyword = searchKeyword.toLowerCase();
          const matchName = category.name.toLowerCase().includes(keyword);
          const matchDescription = category.description?.toLowerCase().includes(keyword);

          if (!matchName && !matchDescription) {
            return false;
          }
        }

        return true;
      });

      // 필터링된 카테고리가 없으면 null 반환
      if (filteredCategories.length === 0) {
        return null;
      }

      return {
        ...blog,
        categories: filteredCategories
      };
    }).filter(blog => blog !== null) as BlogConfig[];
  }, [blogs, selectedBlog, selectedStatus, searchKeyword]);

  // 검색 실행
  const handleSearch = () => {
    const totalCategories = filteredBlogs.reduce((sum, blog) => sum + blog.categories.length, 0);
    toast.success(`${totalCategories}개의 카테고리를 찾았습니다.`);
  };

  // 모달 열기 (추가)
  const handleOpenModal = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  // 모달 열기 (수정)
  const handleEditCategory = (blogId: string, category: Category) => {
    setEditData({
      blogId,
      category: category.name,
      description: category.description,
      status: category.status
    });
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  // 카테고리 저장
  const handleSave = async (data: CategoryData) => {
    try {
      const currentSettings = await getBlogSettings(data.blogId);
      if (!currentSettings) {
        toast.error('블로그 설정을 불러올 수 없습니다.');
        return;
      }

      let updatedCategories: Category[];

      if (editData) {
        // 수정: 기존 카테고리 업데이트
        updatedCategories = currentSettings.categories.map(cat =>
          cat.name === editData.category
            ? { name: data.category, description: data.description, status: data.status }
            : cat
        );
      } else {
        // 추가: 새 카테고리 추가
        const newCategory: Category = {
          name: data.category,
          description: data.description,
          status: data.status
        };
        updatedCategories = [...currentSettings.categories, newCategory];
      }

      // Firebase에 저장
      await saveBlogSettings(data.blogId, {
        categories: updatedCategories,
        design: currentSettings.design
      });

      toast.success(editData ? '카테고리가 수정되었습니다.' : '카테고리가 추가되었습니다.');
      await loadBlogs(); // 목록 새로고침
    } catch (error) {
      console.error('카테고리 저장 실패:', error);
      toast.error('카테고리 저장에 실패했습니다.');
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (blogId: string, categoryName: string) => {
    if (!confirm(`"${categoryName}" 카테고리를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      // 현재 블로그 설정 가져오기
      const currentSettings = await getBlogSettings(blogId);
      if (!currentSettings) {
        toast.error('블로그 설정을 불러올 수 없습니다.');
        return;
      }

      // 해당 카테고리 제외하고 새 배열 생성
      const updatedCategories = currentSettings.categories.filter(
        cat => cat.name !== categoryName
      );

      // Firebase에 저장
      await saveBlogSettings(blogId, {
        categories: updatedCategories,
        design: currentSettings.design
      });

      toast.success('카테고리가 삭제되었습니다.');
      await loadBlogs(); // 목록 새로고침
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      toast.error('카테고리 삭제에 실패했습니다.');
    }
  };

  return (
    <>
      {/* 조회 영역 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* 블로그 선택 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              블로그
            </label>
            <select
              value={selectedBlog}
              onChange={(e) => setSelectedBlog(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">블로그 선택</option>
              {blogs.map((blog) => (
                <option key={blog.blogId} value={blog.blogId}>
                  {blog.blogId}
                </option>
              ))}
            </select>
          </div>

          {/* 상태 선택 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">상태 선택</option>
              <option value="Y">사용중</option>
              <option value="N">사용안함</option>
            </select>
          </div>

          {/* 검색어 입력 */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색어
            </label>
            <input
              type="text"
              placeholder="제목 또는 내용 검색"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* 검색 및 추가 버튼 */}
          <div className="sm:col-span-2 lg:col-span-2 flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 h-10 px-3 sm:px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              검색
            </button>
            <button
              onClick={handleOpenModal}
              className="flex-1 h-10 px-3 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              추가
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">블로그 목록을 불러오는 중...</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full min-w-[640px] border-collapse border-hidden">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-[12%] px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    블로그
                  </th>
                  <th className="w-[22%] px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="w-[47%] px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="w-[9%] px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="w-[8%] px-3 sm:px-6 py-3 " />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBlogs.length > 0 ? (
                  filteredBlogs.map((blog) => (
                    blog.categories.map((category, categoryIndex) => (
                      <tr key={`${blog.blogId}-${categoryIndex}`} className="h-16 hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 overflow-hidden text-ellipsis">
                          {blog.blogId}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm overflow-hidden text-ellipsis">
                          <button
                            onClick={() => handleEditCategory(blog.blogId, category)}
                            className="text-gray-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer font-medium max-w-full truncate block"
                          >
                            {category.name}
                          </button>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-500 max-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                          {category.description || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            category.status === 'Y'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {category.status === 'Y' ? '사용중' : '사용안함'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-xs sm:text-sm">
                          <button
                            onClick={() => handleDeleteCategory(blog.blogId, category.name)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </td>
                      </tr>
                    ))
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

      {/* 카테고리 추가/수정 모달 */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editData={editData}
        blogs={blogs}
      />
    </>
  );
}
