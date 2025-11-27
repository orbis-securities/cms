"use client";

import React from 'react';
import { TableIcon } from 'lucide-react';

interface TableDropdownProps {
  isOpen: boolean;
  tableRows: number;
  tableCols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  onCreateTable: () => void;
  onClose: () => void;
}

export default function TableDropdown({
  isOpen,
  tableRows,
  tableCols,
  onRowsChange,
  onColsChange,
  onCreateTable,
  onClose
}: TableDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 p-3 z-20 min-w-[240px]">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">행 수:</label>
          <select
            value={tableRows}
            onChange={(e) => onRowsChange(Number(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num}행</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">열 수:</label>
          <select
            value={tableCols}
            onChange={(e) => onColsChange(Number(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>{num}열</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 p-2 rounded text-center mb-3">
        <span className="text-xs text-gray-600">
          미리보기: <strong>{tableRows} × {tableCols}</strong> 표
        </span>
      </div>

      <button
        onClick={onCreateTable}
        className="w-full bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700"
      >
        표 생성
      </button>
    </div>
  );
}
