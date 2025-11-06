"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Trash2, FileEdit } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Template } from '@/types';

interface TemplateListProps {
  onEditTemplate: (template: Template) => void;
  onNewTemplate: () => void;
  refreshTrigger?: number; // 템플릿 저장 후 새로고침용
}

const SUPABASE_URL = 'https://onfwfuixsubpwftdwqea.supabase.co/functions/v1';

export default function TemplateList({
  onEditTemplate,
  onNewTemplate,
  refreshTrigger = 0,
}: TemplateListProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);

  // 템플릿 목록 로드
  const loadTemplates = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${SUPABASE_URL}/getTemplates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.code === 'S' && data.result) {
        setTemplates(data.result.templates);
      }
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // 템플릿 내용으로 글쓰기 페이지로 이동
  const handleGoToWrite = useCallback(async (templateId: string, templateTitle: string) => {
    if (!user?.id) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${SUPABASE_URL}/getTemplate?templateId=${templateId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.code === 'S' && data.result) {
        // localStorage에 템플릿 내용 저장
        localStorage.setItem('templateContent', data.result.template.content);
        toast.success(`"${templateTitle}" 템플릿을 불러왔습니다.`);
        // 글쓰기 페이지로 이동
        router.push('/write');
      } else {
        toast.error(data.message || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 조회 실패:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    }
  }, [user?.id, router]);

  // 체크박스 토글
  const handleToggleSelect = useCallback((templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  }, []);

  // 전체 선택/해제
  const handleToggleSelectAll = useCallback(() => {
    if (selectedTemplates.size === templates.length) {
      setSelectedTemplates(new Set());
    } else {
      setSelectedTemplates(new Set(templates.map(t => t.templateId)));
    }
  }, [selectedTemplates.size, templates]);

  // 선택된 템플릿 삭제
  const handleDeleteSelected = async () => {
    if (!user?.id) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    if (selectedTemplates.size === 0) {
      toast.error('삭제할 템플릿을 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedTemplates.size}개의 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const templateIds = Array.from(selectedTemplates);

      const response = await fetch(`${SUPABASE_URL}/deleteTemplate`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          templateId: templateIds
        })
      });

      const data = await response.json();

      if (data.code === 'S') {
        toast.success(`${selectedTemplates.size}개의 템플릿이 삭제되었습니다.`);
        setTemplates(prev => prev.filter(t => !selectedTemplates.has(t.templateId)));
        setSelectedTemplates(new Set());
      } else {
        toast.error(data.message || '템플릿 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      toast.error('템플릿 삭제에 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시에만 템플릿 로드 (한 번만)
  useEffect(() => {
    if (user?.id && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadTemplates();
    }
  }, [user?.id, loadTemplates]);

  // refreshTrigger 변경 시 템플릿 다시 로드
  useEffect(() => {
    if (refreshTrigger > 0 && hasLoadedRef.current) {
      loadTemplates();
      setSelectedTemplates(new Set()); // 선택 초기화
    }
  }, [refreshTrigger, loadTemplates]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // AG Grid 컬럼 정의
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: '',
      width: 50,
      sortable: false,
      resizable: false,
      checkboxSelection: false,
      headerCheckboxSelection: false,
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
      headerComponent: () => (
        <input
          type="checkbox"
          checked={selectedTemplates.size > 0 && selectedTemplates.size === templates.length}
          onChange={handleToggleSelectAll}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      cellRenderer: (params: any) => (
        <input
          type="checkbox"
          checked={selectedTemplates.has(params.data.templateId)}
          onChange={() => handleToggleSelect(params.data.templateId)}
          className="w-4 h-4 cursor-pointer"
        />
      ),
    },
    {
      field: 'title',
      headerName: '템플릿 제목',
      flex: 1,
      minWidth: 250,
      sortable: true,
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
      cellRenderer: (params: any) => (
        <button
          onClick={() => onEditTemplate(params.data)}
          className="block hover:text-blue-600 transition-colors truncate font-medium text-left w-full"
        >
          {params.value}
        </button>
      ),
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      width: 200,
      sortable: true,
      valueFormatter: (params: any) => formatDate(params.value),
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' }
    },
    {
      headerName: '작업',
      width: 120,
      sortable: false,
      cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
      cellRenderer: (params: any) => (
        <button
          onClick={() => handleGoToWrite(params.data.templateId, params.data.title)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="템플릿으로 글쓰기"
        >
          <FileEdit className="w-4 h-4" />
          글쓰기
        </button>
      ),
    }
  ], [onEditTemplate, handleGoToWrite, selectedTemplates, templates.length, handleToggleSelectAll, handleToggleSelect]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
  }), []);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">템플릿 설정</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onNewTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + 새 템플릿
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedTemplates.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              삭제
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </div>
      ) : (
        <div className="grid-container">
          <div className="ag-theme-material compact-grid" style={{ height: 'calc(100vh - 340px)', width: '100%' }}>
            <AgGridReact
              rowData={templates}
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
      )}
    </>
  );
}
