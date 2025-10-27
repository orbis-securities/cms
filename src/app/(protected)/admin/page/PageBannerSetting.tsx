"use client";

import { useState, useEffect } from 'react';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getAllBlogs } from '@/lib/firebase/posts';
import { saveBanner, deleteBanner, getAllBanners, Banner as FirebaseBanner } from '@/lib/firebase/banner';
import BannerModal, { BannerData } from '../components/BannerModal';

export default function PageBannerSetting() {
  const [banners, setBanners] = useState<FirebaseBanner[]>([]);
  const [blogs, setBlogs] = useState<{ blogId: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<BannerData | null>(null);

  // 블로그 목록 로드
  useEffect(() => {
    loadBlogs();
    loadBanners();
  }, []);

  const loadBlogs = async () => {
    try {
      const blogList = await getAllBlogs();
      setBlogs(blogList);
    } catch (error) {
      console.error('블로그 목록 로드 실패:', error);
      toast.error('블로그 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      const bannerList = await getAllBanners();
      setBanners(bannerList);
    } catch (error) {
      console.error('배너 목록 로드 실패:', error);
      toast.error('배너 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 배너 목록
  const filteredBanners = banners.filter(banner => {
    if (selectedBlog && banner.blogId !== selectedBlog) {
      return false;
    }
    if (selectedPage && banner.targetPage !== selectedPage) {
      return false;
    }
    return true;
  });

  const handleSearch = () => {
    toast.success(`${filteredBanners.length}개의 배너를 찾았습니다.`);
  };

  const handleAddBanner = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleSaveBanner = async (data: BannerData) => {
    try {
      if (!data.imageFile) {
        toast.error('이미지를 선택해주세요.');
        return;
      }
      await saveBanner(data.blogId, data.targetPage, data.langType, data.imageFile);
      toast.success('배너가 추가되었습니다.');
      await loadBanners(); // 목록 새로고침
    } catch (error) {
      console.error('배너 저장 실패:', error);
      toast.error('배너 저장에 실패했습니다.');
    }
  };

  const handleDeleteBanner = async (banner: FirebaseBanner) => {
    if (!confirm(`${banner.targetPage} 위치의 배너를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteBanner(banner.blogId, banner.bannerId);
      toast.success('배너가 삭제되었습니다.');
      await loadBanners(); // 목록 새로고침
    } catch (error) {
      console.error('배너 삭제 실패:', error);
      toast.error('배너 삭제에 실패했습니다.');
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

          {/* 위치 선택 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              위치
            </label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">위치 선택</option>
              <option value="home">홈</option>
              <option value="blog">블로그</option>
              <option value="about">소개</option>
            </select>
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
              onClick={handleAddBanner}
              className="flex-1 h-10 px-3 sm:px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              추가
            </button>
          </div>
        </div>
      </div>

      {/* 배너 테이블 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">배너 목록을 불러오는 중...</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full min-w-[640px] border-collapse border-hidden">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-[15%] px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    블로그
                  </th>
                  <th className="w-[15%] px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    위치
                  </th>
                  <th className="w-[20%] px-3 sm:px-6 py-3 text-left text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider">
                    이미지
                  </th>
                  <th className="w-[5%] px-3 sm:px-6 py-3 " />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBanners.length > 0 ? (
                  filteredBanners.map((banner, index) => (
                    <tr key={banner.bannerId} className="h-20 hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {banner.blogId}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {banner.targetPage === 'main' ? '메인' :
                         banner.targetPage === 'detail' ? '상세페이지' : banner.targetPage}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {banner.imageUrl ? (
                          <img
                            src={banner.imageUrl}
                            alt={`${banner.targetPage} 배너`}
                            className="h-12 w-auto object-contain rounded border border-gray-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${banner.imageUrl ? 'hidden' : ''} flex items-center justify-center h-12 w-16 bg-gray-100 rounded border border-gray-200`}>
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center text-xs sm:text-sm">
                        <button
                          onClick={() => handleDeleteBanner(banner)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-sm text-gray-500">
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 배너 추가/수정 모달 */}
      <BannerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveBanner}
        editData={editData}
        blogs={blogs}
      />
    </>
  );
}
