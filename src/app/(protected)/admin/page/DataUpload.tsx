"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

interface UploadResult {
  success: boolean;
  message: string;
  insertedCount?: number;
  warnings?: string[];
}

interface IndexData {
  id: string;
  date: string;
  aus200?: number;
  cn50?: number;
  de30?: number;
  fr40?: number;
  hk50?: number;
  jp225?: number;
  stoxx50?: number;
  uk100?: number;
  us30?: number;
  us500?: number;
  ustec100?: number;
  created_at?: string;
}

export default function DataUpload() {
  // 업로드 관련 상태
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  // 데이터 조회 관련 상태
  const [indexData, setIndexData] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<AgGridReact>(null);

  // 지수 컬럼 목록
  const indexColumns = ['aus200', 'cn50', 'de30', 'fr40', 'hk50', 'jp225', 'stoxx50', 'uk100', 'us30', 'us500', 'ustec100'];

  // AG Grid 컬럼 정의
  const columnDefs: ColDef<IndexData>[] = [
    {
      field: 'date',
      headerName: '날짜',
      width: 120,
      filter: true,
      sortable: true,
      pinned: 'left',
    },
    ...indexColumns.map((col) => ({
      field: col as keyof IndexData,
      headerName: col.toUpperCase(),
      width: 100,
      filter: 'agNumberColumnFilter',
      sortable: true,
      valueFormatter: (params: { value: number | null | undefined }) => {
        if (params.value == null) return '';
        return Number(params.value).toLocaleString('ko-KR', { maximumFractionDigits: 4 });
      },
    })),
  ];

  // 데이터 조회
  const fetchIndexData = useCallback(async () => {
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem('authToken');
      if (!accessToken) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      const params = new URLSearchParams();
      params.append('pageSize', '1000'); // 더 많은 데이터 조회
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);

      const response = await fetch(`${SUPABASE_URL}/getIndexData?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.code === 'S') {
        setIndexData(result.result?.records || []);
      } else {
        console.error('API 에러:', { status: response.status, result });
        toast.error(result.message || '데이터 조회 실패');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('서버 연결에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [filterStartDate, filterEndDate]);

  // 초기 로드
  useEffect(() => {
    fetchIndexData();
  }, []);

  // 파일 검증
  const validateFile = (file: File): boolean => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      toast.error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하만 가능합니다.');
      return false;
    }

    return true;
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadResult(null);

      // 시트 목록 추출
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheets = workbook.SheetNames;
        setSheetNames(sheets);
        setSelectedSheet(sheets[0] || '');
      } catch (error) {
        console.error('시트 목록 추출 실패:', error);
        setSheetNames([]);
        setSelectedSheet('');
      }
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 업로드 실행
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const accessToken = localStorage.getItem('authToken');
      if (!accessToken) {
        toast.error('로그인이 필요합니다.');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('baseYear', baseYear.toString());
      if (selectedSheet) {
        formData.append('sheetName', selectedSheet);
      }
      console.log('업로드 baseYear:', baseYear, 'sheetName:', selectedSheet);

      const response = await fetch(`${SUPABASE_URL}/uploadIndexData`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadResult({
          success: true,
          message: result.message || `${result.data?.insertedCount || 0}개의 데이터가 저장되었습니다.`,
          insertedCount: result.data?.insertedCount,
          warnings: result.data?.warnings,
        });
        toast.success(result.message || '업로드 완료');
        // 업로드 성공 후 데이터 새로고침
        fetchIndexData();
        handleRemoveFile();
      } else {
        setUploadResult({
          success: false,
          message: result.message || '업로드 실패',
          warnings: result.errors,
        });
        toast.error(result.message || '업로드 실패');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: '서버 연결에 실패했습니다.',
      });
      toast.error('서버 연결에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // 필터 초기화
  const handleResetFilter = () => {
    setFilterStartDate('');
    setFilterEndDate('');
  };

  // 연도 옵션
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      {/* 업로드 섹션 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Index 데이터 등록</h2>

        {/* 기준 연도 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            12월이 속한 연도
          </label>
          <select
            value={baseYear}
            onChange={(e) => setBaseYear(Number(e.target.value))}
            className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            예: 2025년 12월 ~ 2026년 1월 데이터면 <strong>2025</strong> 선택 (1월은 자동으로 다음 해로 저장)
          </p>
        </div>

        {/* 파일 업로드 영역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-purple-500 bg-purple-50'
              : selectedFile
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleInputChange}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <FileSpreadsheet className="w-12 h-12 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                엑셀 파일을 드래그하여 놓거나
              </p>
              <button
                onClick={handleSelectClick}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                파일 선택
              </button>
              <p className="mt-3 text-sm text-gray-500">
                .xlsx, .xls 파일 (최대 10MB)
              </p>
            </>
          )}
        </div>

        {/* 시트 선택 */}
        {sheetNames.length > 1 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시트 선택
            </label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="w-60 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {sheetNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 업로드 버튼 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
              !selectedFile || isUploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                업로드 중...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                업로드
              </>
            )}
          </button>
        </div>

        {/* 업로드 결과 */}
        {uploadResult && (
          <div className={`mt-6 p-4 rounded-lg ${
            uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {uploadResult.message}
                </p>

                {uploadResult.insertedCount !== undefined && (
                  <p className="mt-1 text-sm text-green-700">
                    저장된 레코드: {uploadResult.insertedCount}개
                  </p>
                )}

                {uploadResult.warnings && uploadResult.warnings.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-amber-700 mb-1">경고:</p>
                    <ul className="text-sm text-amber-600 list-disc list-inside max-h-32 overflow-y-auto">
                      {uploadResult.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 데이터 조회 섹션 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">등록된 데이터</h2>
          <button
            onClick={fetchIndexData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {/* 필터 */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">시작일</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">종료일</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchIndexData}
              className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              조회
            </button>
            <button
              onClick={handleResetFilter}
              className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 데이터 테이블 */}
        <div className="ag-theme-material" style={{ height: 400, width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            theme="legacy"
            rowData={indexData}
            columnDefs={columnDefs}
            defaultColDef={{
              resizable: true,
            }}
            pagination={true}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            loading={isLoading}
            overlayNoRowsTemplate="등록된 데이터가 없습니다."
          />
        </div>

        <p className="mt-2 text-sm text-gray-500">
          총 {indexData.length}개의 레코드
        </p>
      </div>
    </div>
  );
}
