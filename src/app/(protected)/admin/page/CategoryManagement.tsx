"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import CommonCodeSelect from '@/components/common/CommonCodeSelect';
import CategoryModal from '../components/CategoryModal';
import CategoryTranslationModal, { CategoryTranslationData } from '../components/CategoryTranslationModal';
import { Category } from '@/types';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const SUPABASE_URL = 'https://onfwfuixsubpwftdwqea.supabase.co/functions/v1';

export default function CategoryManagement() {
  // 필터링 상태
  const [selectedBlog, setSelectedBlog] = useState<string>('');
  const [selectUseYn, setSelectUseYn] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 카테고리 상태
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<Category | null>(null);
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  const [translationEditData, setTranslationEditData] = useState<CategoryTranslationData | null>(null);

  // Grid API refs
  const categoryGridRef = useRef<any>(null);
  const translationGridRef = useRef<any>(null);

  // 초기 로드
  useEffect(() => {
    loadCategoryList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 카테고리 목록 로드
  const loadCategoryList = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();

      if (selectedBlog) {
        params.append('blogId', selectedBlog);
      }
      if (selectUseYn) {
        params.append('useYn', selectUseYn);
      }
      if (searchKeyword) {
        params.append('searchKeyword', searchKeyword);
      }

      const response = await fetch(`${SUPABASE_URL}/getCategoryList?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.code === 'S' && data.result) {
        const categories = Array.isArray(data.result) ? data.result : data.result.categories || [];

        setParentCategories(categories.map((cat: any) => ({
          categoryId: cat.categoryId,
          blogId: cat.blogId,
          blogNm: cat.blogNm,
          name: cat.name,
          sortOrder: cat.sortOrder,
          useYn: cat.useYn,
          useYnNm: cat.useYnNm
        })));
      }
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      toast.error('카테고리를 불러오는데 실패했습니다.');
    } finally {
    }
  }, [selectedBlog, selectUseYn, searchKeyword]);

  // 카테고리 다국어 로드
  const loadCategoryTranslations = useCallback(async (blogId: string, categoryId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams();
      params.append('blogId', blogId);
      params.append('categoryId', categoryId);

      const response = await fetch(`${SUPABASE_URL}/getCategoryTranslations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.code === 'S' && data.result) {
        const translationList = data.result.translations;
        setTranslations(translationList);
      }
    } catch (error) {
      console.error('카테고리 다국어 로드 실패:', error);
      toast.error('카테고리 다국어를 불러오는데 실패했습니다.');
    } finally {
    }
  }, []);

  // 검색 실행
  const handleSearch = useCallback(() => {
    loadCategoryList();
    setTranslations([]);
  }, [loadCategoryList]);

  // 카테고리 추가 모달 열기
  const handleAddCategory = useCallback(() => {
    setEditData(null);
    setIsModalOpen(true);
  }, []);

  // 카테고리 수정 모달 열기
  const handleEditCategory = useCallback((category: Category) => {
    setEditData(category);
    setIsModalOpen(true);
  }, []);

  // 모달 닫기
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditData(null);
  }, []);

  // 카테고리 저장 후 콜백
  const handleSaveCategory = useCallback(() => {
    handleSearch();
  }, [handleSearch]);

  // 카테고리 다국어 추가 모달 열기
  const handleAddTranslation = useCallback(() => {
    if (!selectedCategory) {
      toast.error('카테고리를 먼저 선택해주세요.');
      return;
    }

    setTranslationEditData({
      categoryId: selectedCategory.categoryId,
      blogId: selectedCategory.blogId,
      langType: '',
      name: '',
      description: '',
      useYn: 'Y',
      blogNm: selectedCategory.blogNm,
      categoryNm: selectedCategory.name
    });
    setIsTranslationModalOpen(true);
  }, [selectedCategory]);

  // 카테고리 다국어 수정 모달 열기
  const handleEditTranslation = useCallback((translation: any) => {
    setTranslationEditData({
      categoryId: translation.categoryId,
      blogId: translation.blogId,
      langType: translation.langType,
      name: translation.name,
      description: translation.description,
      useYn: translation.useYn,
      blogNm: translation.blogNm,
      categoryNm: translation.categoryNm
    });
    setIsTranslationModalOpen(true);
  }, []);

  // 카테고리 다국어 저장 후 콜백
  const handleSaveTranslation = useCallback(() => {
    if (selectedCategory) {
      loadCategoryTranslations(selectedCategory.blogId, selectedCategory.categoryId);
    }
  }, [selectedCategory, loadCategoryTranslations]);

  // 카테고리 AG Grid 컬럼 정의
  const parentColumnDefs = useMemo<ColDef[]>(() => [
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
      width: 100,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'categoryId',
      headerName: 'ID',
      width: 60,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'name',
      headerName: '카테고리명',
      flex: 1,
      minWidth: 150,
      sortable: true,
      cellRenderer: (params: any) => (
        <button
          onClick={() => handleEditCategory(params.data)}
          className="w-full text-center hover:text-blue-600 transition-colors font-medium"
        >
          {params.value}
        </button>
      ),
    },
    {
      field: 'useYnNm',
      headerName: '사용여부',
      width: 80,
      sortable: true,
      cellClass: 'ag-cell-center'
    }
  ], [handleEditCategory]);

  // 카테고리 다국어 AG Grid 컬럼 정의
  const translationColumnDefs = useMemo<ColDef[]>(() => [
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
      field: 'langTypeNm',
      headerName: '언어',
      width: 100,
      sortable: true,
      cellClass: 'ag-cell-center'
    },
    {
      field: 'name',
      headerName: '이름',
      flex: 1,
      minWidth: 100,
      sortable: true,
      cellRenderer: (params: any) => (
        <button
          onClick={() => handleEditTranslation(params.data)}
          className="w-full text-center hover:text-blue-600 transition-colors font-medium"
        >
          {params.value}
        </button>
      ),
    },
    {
      field: 'description',
      headerName: '설명',
      flex: 1,
      minWidth: 300,
      sortable: true,
    }
  ], [handleEditTranslation]);

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

          {/* 사용여부 선택 */}
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사용여부
            </label>
            <CommonCodeSelect
              groupCode="USE_YN"
              value={selectUseYn}
              onChange={setSelectUseYn}
              placeholder="상태 선택"
              showAll={true}
              allLabel="전체"
              className="w-full h-10"
            />
          </div>

          {/* 검색어 입력 */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색어
            </label>
            <input
              type="text"
              placeholder="카테고리명"
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
          <div className="sm:col-span-1 lg:col-span-1 flex gap-2">
            <button
              onClick={handleSearch}
              className="flex-1 h-10 px-3 sm:px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              검색
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 그리드 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* 카테고리 */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            {/* 버튼 영역 */}
            <div className="flex gap-2 mb-3 justify-end">
              <button
                onClick={handleAddCategory}
                className="w-10 h-10 flex items-center justify-center border border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors"
                title="추가"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* 그리드 */}
            <div className="ag-theme-material compact-grid" style={{ height: 'calc(100vh - 400px)', width: '100%' }}>
              <AgGridReact
                ref={categoryGridRef}
                rowData={parentCategories}
                columnDefs={parentColumnDefs}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                }}
                rowSelection="single"
                theme="legacy"
                animateRows={true}
                rowHeight={50}
                headerHeight={55}
                suppressCellFocus={true}
                domLayout="normal"
                onSelectionChanged={(event) => {
                  const selectedRows = event.api.getSelectedRows();
                  if (selectedRows.length > 0) {
                    const selected = selectedRows[0];
                    setSelectedCategory(selected);
                    loadCategoryTranslations(selected.blogId, selected.categoryId);
                  } else {
                    setSelectedCategory(null);
                    setTranslations([]);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* 카테고리 다국어 */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            {/* 버튼 영역 */}
            <div className="flex gap-2 mb-3 justify-end">
              <button
                onClick={handleAddTranslation}
                className="w-10 h-10 flex items-center justify-center border border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors"
                title="추가"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* 그리드 */}
            <div className="ag-theme-material compact-grid" style={{ height: 'calc(100vh - 400px)', width: '100%' }}>
              <AgGridReact
                ref={translationGridRef}
                rowData={translations}
                columnDefs={translationColumnDefs}
                defaultColDef={{
                  resizable: true,
                  sortable: true,
                }}
                rowSelection="single"
                theme="legacy"
                animateRows={true}
                rowHeight={50}
                headerHeight={55}
                suppressCellFocus={true}
                domLayout="normal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 수정 모달 */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        onDelete={handleSearch}
        editData={editData}
      />

      {/* 카테고리 다국어 수정 모달 */}
      <CategoryTranslationModal
        isOpen={isTranslationModalOpen}
        onClose={() => {
          setIsTranslationModalOpen(false);
          setTranslationEditData(null);
        }}
        onSave={handleSaveTranslation}
        onDelete={handleSaveTranslation}
        editData={translationEditData}
      />
    </>
  );
}