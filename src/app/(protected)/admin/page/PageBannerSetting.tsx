"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import CommonCodeSelect from '@/components/common/CommonCodeSelect';
import BannerModal from '../components/BannerModal';
import { Banner } from '@/types';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

export default function PageBannerSetting() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('');
  const [selectedUseYn, setSelectedUseYn] = useState<string>('');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Banner | null>(null);

  // Grid API ref
  const gridRef = useRef<any>(null);

  // 초기 로드
  useEffect(() => {
    loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBanners = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();

      if (selectedBlog) {
        params.append('blogId', selectedBlog);
      }
      if (selectedPage) {
        params.append('positionCode', selectedPage);
      }
      if (selectedLang) {
        params.append('langType', selectedLang);
      }
      if (selectedUseYn) {
        params.append('useYn', selectedUseYn);
      }

      const response = await fetch(`${SUPABASE_URL}/getBanners?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.code === 'S' && data.result) {
        setBanners(data.result.banners);
      }
    } catch (error) {
      toast.error('배너 목록을 불러오는데 실패했습니다.');
    }
  }, [selectedBlog, selectedPage, selectedLang, selectedUseYn]);

  const handleSearch = useCallback(() => {
    loadBanners();
  }, [loadBanners]);

  const handleAddBanner = useCallback(() => {
    setEditData(null);
    setIsModalOpen(true);
  }, []);

  const handleEditBanner = useCallback((banner: Banner) => {
    setEditData(banner);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditData(null);
  }, []);

  const handleSaveBanner = useCallback(() => {
    loadBanners();
  }, [loadBanners]);

  const handleDeleteSelected = useCallback(async () => {
    const selectedRows = gridRef.current?.api.getSelectedRows();

    if (!selectedRows || selectedRows.length === 0) {
      toast.error('삭제할 배너를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedRows.length}개의 배너를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const bannerIds = selectedRows.map((row: Banner) => row.bannerId);

      const response = await fetch(`${SUPABASE_URL}/deleteBanners`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bannerIds: bannerIds
        })
      });

      const result = await response.json();

      if (result.code === 'S') {
        toast.success(`${selectedRows.length}개의 배너가 삭제되었습니다.`);
        loadBanners();
      } else {
        toast.error(result.message || '배너 삭제에 실패했습니다.');
      }
    } catch (error) {
      toast.error('배너 삭제에 실패했습니다.');
    }
  }, [loadBanners]);

  // AG Grid 컬럼 정의
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 50,
      sortable: false,
      resizable: false,
      suppressHeaderMenuButton: true
    },
    {
      field: 'blogNm',
      headerName: '블로그',
      width: 120,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'bannerName',
      headerName: '배너명',
      flex: 1,
      minWidth: 150,
      sortable: true,
      cellRenderer: (params: any) => (
        <button
          onClick={() => handleEditBanner(params.data)}
          className="w-full text-center hover:text-blue-600 transition-colors font-medium"
        >
          {params.value}
        </button>
      )
    },
    {
      field: 'imageUrl',
      headerName: '이미지',
      flex: 2,
      minWidth: 300,
      sortable: false,
      cellClass: 'ag-cell-center',
      cellRenderer: (params: any) => {
        if (params.value) {
          return (
            <div className="flex items-center h-full">
              <img
                src={params.value}
                alt="배너 이미지"
                className="h-12 w-auto object-contain rounded"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                }}
              />
            </div>
          );
        }
        return '-';
      }
    },
    {
      field: 'langTypeNm',
      headerName: '언어',
      width: 100,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'positionCodeNm',
      headerName: '위치',
      width: 120,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'viewOrder',
      headerName: '순서',
      width: 70,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'useYnNm',
      headerName: '사용여부',
      width: 100,
      sortable: true,
      cellClass: 'ag-cell-center'
    }
  ], [handleEditBanner]);

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
            <CommonCodeSelect
              groupCode="BLOG_ID"
              value={selectedBlog}
              onChange={setSelectedBlog}
              placeholder="블로그 선택"
              showAll={true}
              allLabel="전체"
              className="w-full h-10"
            />
          </div>

          {/* 언어 선택 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              언어
            </label>
            <CommonCodeSelect
              groupCode="LANG"
              value={selectedLang}
              onChange={setSelectedLang}
              placeholder="언어 선택"
              showAll={true}
              allLabel="전체"
              className="w-full h-10"
            />
          </div>

          {/* 위치 선택 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              위치
            </label>
            <CommonCodeSelect
              groupCode="BANNER_POSITION"
              value={selectedPage}
              onChange={setSelectedPage}
              placeholder="위치 선택"
              showAll={true}
              allLabel="전체"
              className="w-full h-10"
            />
          </div>

          {/* 사용여부 선택 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사용여부
            </label>
            <CommonCodeSelect
              groupCode="USE_YN"
              value={selectedUseYn}
              onChange={setSelectedUseYn}
              placeholder="사용여부 선택"
              showAll={true}
              allLabel="전체"
              className="w-full h-10"
            />
          </div>

          {/* 검색, 추가, 삭제 버튼 */}
          <div className="sm:col-span-1 lg:col-span-2 flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 h-10 px-3 sm:px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              검색
            </button>
            <button
              onClick={handleAddBanner}
              className="flex-1 h-10 px-3 sm:px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
              title="추가"
            >
              추가
            </button>
            <button
              onClick={handleDeleteSelected}
              className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 배너 그리드 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">

        {/* 그리드 */}
        <div className="ag-theme-material compact-grid" style={{ height: 'calc(100vh - 350px)', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={banners}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
              sortable: true,
            }}
            rowSelection="multiple"
            theme="legacy"
            animateRows={true}
            rowHeight={60}
            headerHeight={55}
            suppressCellFocus={true}
            domLayout="normal"
          />
        </div>
      </div>

      {/* 배너 추가/수정 모달 */}
      <BannerModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveBanner}
        editData={editData}
      />
    </>
  );
}