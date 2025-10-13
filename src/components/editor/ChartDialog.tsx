"use client";

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Plus, Trash2, BarChart3, LineChart, PieChart as PieChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (chartType: 'bar' | 'line' | 'pie' | 'area', data: any[], title: string, units: Record<string, string>, colors: Record<string, string>) => void;
}

interface ValueColumn {
  id: string;
  label: string;
  unit: string;
  color: string;
}

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const ChartDialog: React.FC<ChartDialogProps> = ({ isOpen, onClose, onInsert }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [title, setTitle] = useState('');
  const [valueColumns, setValueColumns] = useState<ValueColumn[]>([
    { id: 'value1', label: '값 1', unit: '', color: PRESET_COLORS[0] },
    { id: 'value2', label: '값 2', unit: '', color: PRESET_COLORS[1] },
  ]);
  const [dataRows, setDataRows] = useState<Record<string, any>[]>([
    { label: '항목 1', value1: 100, value2: 80 },
    { label: '항목 2', value1: 150, value2: 120 },
    { label: '항목 3', value1: 120, value2: 140 },
  ]);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    console.log('🔄 ChartDialog resetForm 호출');
    setChartType('bar');
    setTitle('');
    setValueColumns([
      { id: 'value1', label: '값 1', unit: '', color: PRESET_COLORS[0] },
      { id: 'value2', label: '값 2', unit: '', color: PRESET_COLORS[1] },
    ]);
    setDataRows([
      { label: '항목 1', value1: 100, value2: 80 },
      { label: '항목 2', value1: 150, value2: 120 },
      { label: '항목 3', value1: 120, value2: 140 },
    ]);
  };

  const handleAddColumn = () => {
    if (valueColumns.length >= 3) {
      toast.error('최대 3개의 컬럼까지만 추가할 수 있습니다.');
      return;
    }
    const newColumnId = `value${valueColumns.length + 1}`;
    const newColumn = {
      id: newColumnId,
      label: `값 ${valueColumns.length + 1}`,
      unit: '',
      color: PRESET_COLORS[valueColumns.length % PRESET_COLORS.length]
    };
    setValueColumns([...valueColumns, newColumn]);

    // 모든 데이터 행에 새 컬럼 추가
    const updatedRows = dataRows.map(row => ({ ...row, [newColumnId]: 0 }));
    setDataRows(updatedRows);
  };

  const handleRemoveColumn = (columnId: string) => {
    if (valueColumns.length <= 1) {
      toast.error('최소 1개의 컬럼이 필요합니다.');
      return;
    }

    // 컬럼 제거
    setValueColumns(valueColumns.filter(col => col.id !== columnId));

    // 모든 데이터 행에서 해당 컬럼 제거
    const updatedRows = dataRows.map(row => {
      const { [columnId]: removed, ...rest } = row;
      return rest;
    });
    setDataRows(updatedRows);
  };

  const handleUpdateColumnLabel = (columnId: string, newLabel: string) => {
    setValueColumns(valueColumns.map(col =>
      col.id === columnId ? { ...col, label: newLabel } : col
    ));
  };

  const handleUpdateColumnUnit = (columnId: string, newUnit: string) => {
    setValueColumns(valueColumns.map(col =>
      col.id === columnId ? { ...col, unit: newUnit } : col
    ));
  };

  const handleUpdateColumnColor = (columnId: string, newColor: string) => {
    setValueColumns(valueColumns.map(col =>
      col.id === columnId ? { ...col, color: newColor } : col
    ));
  };

  const handleAddRow = () => {
    const newRow: Record<string, any> = { label: `항목 ${dataRows.length + 1}` };
    valueColumns.forEach(col => {
      newRow[col.id] = 0;
    });
    setDataRows([...dataRows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    if (dataRows.length <= 1) {
      toast.error('최소 1개의 데이터 행이 필요합니다.');
      return;
    }
    setDataRows(dataRows.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: string, value: string | number) => {
    const newRows = [...dataRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setDataRows(newRows);
  };

  const handleInsert = () => {
    // 데이터 유효성 검사
    if (!title.trim()) {
      toast.error('차트 제목을 입력해주세요.');
      return;
    }

    if (dataRows.length === 0) {
      toast.error('최소 1개의 데이터가 필요합니다.');
      return;
    }

    // 데이터 변환 (name 키로 통일, 커스텀 라벨 적용)
    const formattedData = dataRows.map(row => {
      const result: Record<string, any> = { name: row.label };
      valueColumns.forEach(column => {
        result[column.label] = row[column.id] ?? 0;
      });
      return result;
    });

    // 컬럼 라벨별 단위 및 색상 매핑
    const units: Record<string, string> = {};
    const colors: Record<string, string> = {};
    valueColumns.forEach(column => {
      units[column.label] = column.unit;
      colors[column.label] = column.color;
    });

    console.log('📊 ChartDialog handleInsert:', {
      chartType,
      dataLength: formattedData.length,
      title,
      units,
      colors
    });

    onInsert(chartType, formattedData, title, units, colors);
    toast.success('차트가 삽입되었습니다!');

    // 에디터 업데이트가 완료될 시간을 주기 위해 onClose를 지연
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const chartTypes = [
    { type: 'bar' as const, icon: BarChart3, label: '막대 차트' },
    { type: 'line' as const, icon: LineChart, label: '선 차트' },
    { type: 'pie' as const, icon: PieChartIcon, label: '파이 차트' },
    { type: 'area' as const, icon: AreaChartIcon, label: '영역 차트' },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                차트 추가
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </Dialog.Close>
            </div>

            {/* 차트 타입 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                차트 유형
              </label>
              <div className="grid grid-cols-4 gap-3">
                {chartTypes.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => {
                      console.log('📌 차트 타입 선택:', type);
                      setChartType(type);
                    }}
                    className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                      chartType === type
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 차트 제목 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                차트 제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 월별 매출 현황"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 값 라벨 설정 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  데이터 컬럼 이름
                </label>
                <button
                  onClick={handleAddColumn}
                  disabled={valueColumns.length >= 3}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    valueColumns.length >= 3
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  컬럼 추가
                </button>
              </div>
              <div className="space-y-2">
                {valueColumns.map((column, index) => (
                  <div key={column.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={column.label}
                      onChange={(e) => handleUpdateColumnLabel(column.id, e.target.value)}
                      placeholder={`예: ${index === 0 ? '실적' : index === 1 ? '목표' : '평균'}`}
                      className="flex-1 h-10 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={column.unit}
                      onChange={(e) => handleUpdateColumnUnit(column.id, e.target.value)}
                      placeholder="단위 (예: 원, %, 개)"
                      className="w-32 h-10 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="color"
                      value={column.color}
                      onChange={(e) => handleUpdateColumnColor(column.id, e.target.value)}
                      className="w-14 h-10 border border-gray-300 rounded-lg cursor-pointer"
                      title="색상 선택"
                    />
                    {valueColumns.length > 1 && (
                      <button
                        onClick={() => handleRemoveColumn(column.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                💡 팁: 1~3개의 데이터 컬럼을 추가할 수 있으며, 각 컬럼마다 원하는 단위와 색상을 지정할 수 있습니다.
              </p>
            </div>

            {/* 데이터 입력 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  데이터 입력
                </label>
                <button
                  onClick={handleAddRow}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  행 추가
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-1/3">
                        라벨
                      </th>
                      {valueColumns.map((column) => (
                        <th key={column.id} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          {column.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dataRows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={row.label}
                            onChange={(e) => handleUpdateRow(index, 'label', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </td>
                        {valueColumns.map((column) => (
                          <td key={column.id} className="px-4 py-3">
                            <input
                              type="number"
                              value={row[column.id] ?? 0}
                              onChange={(e) => handleUpdateRow(index, column.id, parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemoveRow(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            disabled={dataRows.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                💡 팁: 파이 차트는 첫 번째 값만 사용됩니다. 다른 차트는 여러 값을 비교할 수 있습니다.
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleInsert}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                차트 삽입
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ChartDialog;
