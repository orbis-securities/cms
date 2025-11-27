"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { TableIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TableEditorProps {
  editor: Editor | null;
  isVisible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function TableEditor({ editor, isVisible, position, onClose }: TableEditorProps) {
  // 테두리 시스템 상태
  const [borderSelection, setBorderSelection] = useState<'all' | 'top' | 'bottom' | 'left' | 'right'>('all');
  const [borderStyle, setBorderStyle] = useState<'solid' | 'none' | 'dotted' | 'double'>('solid');
  const [borderWidth, setBorderWidth] = useState<'1px' | '2px' | '3px' | '4px'>('1px');
  const [borderColor, setBorderColor] = useState('#374151');
  const [tableAlign, setTableAlign] = useState<'left' | 'center' | 'right'>('left');
  const [tableWidth, setTableWidth] = useState<number>(100); // 퍼센트 값

  // 표 클릭 시 현재 정렬 및 크기 상태 감지
  useEffect(() => {
    if (!isVisible || !editor) return;

    try {
      const { state } = editor;
      const { selection } = state;

      // 현재 테이블 노드 찾기
      state.doc.nodesBetween(selection.from, selection.to, (node) => {
        if (node.type.name === 'table') {
          const align = node.attrs.align || 'left';
          const width = node.attrs.width || '100%';

          setTableAlign(align as 'left' | 'center' | 'right');

          // 퍼센트 값 추출
          if (width.includes('%')) {
            const widthNum = parseInt(width.replace('%', ''));
            setTableWidth(widthNum);
          } else {
            setTableWidth(100);
          }

          return false;
        }
      });
    } catch (error) {
      console.error('❌ 표 상태 감지 실패:', error);
    }
  }, [isVisible, editor]);

  const createBorderStyle = useCallback((width: string, style: string, color: string) => {
    return `${width} ${style} ${color}`;
  }, []);

  // 표 정렬 적용 함수
  const applyTableAlign = useCallback((align: 'left' | 'center' | 'right') => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      // 현재 테이블 노드 찾기
      const { state } = editor;
      const { selection } = state;
      let tablePos = -1;

      // 현재 선택 위치에서 테이블 노드 찾기
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'table') {
          tablePos = pos;
          return false;
        }
      });

      if (tablePos !== -1) {
        const tableNode = state.doc.nodeAt(tablePos);
        if (tableNode) {
          const tr = state.tr.setNodeMarkup(tablePos, undefined, {
            ...tableNode.attrs,
            align: align
          });
          editor.view.dispatch(tr);
          setTableAlign(align);

          const alignText = { left: '왼쪽', center: '중앙', right: '오른쪽' };
          toast.success(`표가 ${alignText[align]} 정렬되었습니다!`);
        }
      }
    } catch (error) {
      console.error('❌ 표 정렬 실패:', error);
      toast.error('표 정렬에 실패했습니다.');
    }
  }, [editor]);

  // 표 크기 적용 함수
  const applyTableWidth = useCallback((width: number) => {
    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    try {
      // 현재 테이블 노드 찾기
      const { state } = editor;
      const { selection } = state;
      let tablePos = -1;

      // 현재 선택 위치에서 테이블 노드 찾기
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'table') {
          tablePos = pos;
          return false;
        }
      });

      if (tablePos !== -1) {
        const tableNode = state.doc.nodeAt(tablePos);
        if (tableNode) {
          const tr = state.tr.setNodeMarkup(tablePos, undefined, {
            ...tableNode.attrs,
            width: `${width}%`
          });
          editor.view.dispatch(tr);
          setTableWidth(width);

          toast.success(`표 크기가 ${width}%로 설정되었습니다!`);
        }
      }
    } catch (error) {
      console.error('❌ 표 크기 설정 실패:', error);
      toast.error('표 크기 설정에 실패했습니다.');
    }
  }, [editor]);

  const applyBorderToSelection = useCallback(() => {
    console.log('🎯 테두리 적용 시작');
    console.log('📊 현재 설정:', { borderSelection, borderWidth, borderStyle, borderColor });

    if (!editor) {
      toast.error('에디터가 준비되지 않았습니다.');
      return;
    }

    if (!editor.isActive('tableCell') && !editor.isActive('tableHeader')) {
      toast.error('표의 셀을 선택해주세요.');
      return;
    }

    const borderStyleStr = createBorderStyle(borderWidth, borderStyle, borderColor);

    try {
      if (borderSelection === 'all') {
        // 전체 테두리 적용
        editor.chain().focus().setCellAttribute('borderTop', borderStyleStr).run();
        editor.chain().focus().setCellAttribute('borderBottom', borderStyleStr).run();
        editor.chain().focus().setCellAttribute('borderLeft', borderStyleStr).run();
        editor.chain().focus().setCellAttribute('borderRight', borderStyleStr).run();
        console.log('✅ 전체 테두리 적용:', borderStyleStr);
      } else if (borderSelection === 'top') {
        editor.chain().focus().setCellAttribute('borderTop', borderStyleStr).run();
        console.log('✅ 위쪽 테두리 적용:', borderStyleStr);
      } else if (borderSelection === 'bottom') {
        editor.chain().focus().setCellAttribute('borderBottom', borderStyleStr).run();
        console.log('✅ 아래쪽 테두리 적용:', borderStyleStr);
      } else if (borderSelection === 'left') {
        editor.chain().focus().setCellAttribute('borderLeft', borderStyleStr).run();
        console.log('✅ 왼쪽 테두리 적용:', borderStyleStr);
      } else if (borderSelection === 'right') {
        editor.chain().focus().setCellAttribute('borderRight', borderStyleStr).run();
        console.log('✅ 오른쪽 테두리 적용:', borderStyleStr);
      }

      const selectionText = {
        'all': '전체 테두리',
        'top': '위쪽 테두리',
        'bottom': '아래쪽 테두리',
        'left': '왼쪽 테두리',
        'right': '오른쪽 테두리'
      };

      toast.success(`${selectionText[borderSelection]}가 적용되었습니다!`);
    } catch (error) {
      console.error('❌ 테두리 적용 실패:', error);
      toast.error('테두리 적용에 실패했습니다.');
    }
  }, [editor, borderSelection, borderWidth, borderStyle, borderColor, createBorderStyle]);

  if (!isVisible) return null;

  return (
    <div
      className="table-editor-panel fixed bg-white border rounded-lg shadow-xl p-4 z-30 min-w-[280px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <div className="mb-4">
        <h4 className="font-semibold flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-green-600" />
          표 편집
        </h4>
        <p className="text-xs text-gray-600 mt-1">
          셀을 선택 후 스타일을 변경하세요
        </p>
      </div>

      {/* 표 크기 */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">표 크기</h5>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={tableWidth}
              onChange={(e) => {
                const width = parseInt(e.target.value);
                setTableWidth(width);
              }}
              onMouseUp={(e) => {
                const width = parseInt((e.target as HTMLInputElement).value);
                applyTableWidth(width);
              }}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 min-w-[45px]">{tableWidth}%</span>
          </div>
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((width) => (
              <button
                key={width}
                onClick={() => applyTableWidth(width)}
                className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                  tableWidth === width
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {width}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 표 정렬 */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">표 정렬</h5>
        <div className="flex gap-2">
          <button
            onClick={() => applyTableAlign('left')}
            className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
              tableAlign === 'left'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="왼쪽 정렬"
          >
            ⬅ 왼쪽
          </button>
          <button
            onClick={() => applyTableAlign('center')}
            className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
              tableAlign === 'center'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="중앙 정렬"
          >
            ↔ 중앙
          </button>
          <button
            onClick={() => applyTableAlign('right')}
            className={`flex-1 px-3 py-2 text-sm rounded border transition-colors ${
              tableAlign === 'right'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
            title="오른쪽 정렬"
          >
            ➡ 오른쪽
          </button>
        </div>
      </div>

      {/* 행/열 조작 */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">행/열 관리</h5>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => editor?.chain().focus().addRowBefore().run()}
            className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200"
          >
            ↑ 행 추가
          </button>
          <button
            onClick={() => editor?.chain().focus().addRowAfter().run()}
            className="px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100 border border-green-200"
          >
            ↓ 행 추가
          </button>
          <button
            onClick={() => editor?.chain().focus().addColumnBefore().run()}
            className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
          >
            ← 열 추가
          </button>
          <button
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
            className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
          >
            → 열 추가
          </button>
          <button
            onClick={() => {
              if (confirm('현재 행을 삭제하시겠습니까?')) {
                editor?.chain().focus().deleteRow().run();
              }
            }}
            className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
          >
            행 삭제
          </button>
          <button
            onClick={() => {
              if (confirm('현재 열을 삭제하시겠습니까?')) {
                editor?.chain().focus().deleteColumn().run();
              }
            }}
            className="px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
          >
            열 삭제
          </button>
        </div>
      </div>

      {/* 테두리 시스템 */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">테두리 설정</h5>

        {/* 테두리 설정 */}
        <div className="grid grid-cols-5 gap-1 mb-3">
          <button
            onClick={() => setBorderSelection('all')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderSelection === 'all' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setBorderSelection('top')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderSelection === 'top' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
            }`}
          >
            위
          </button>
          <button
            onClick={() => setBorderSelection('bottom')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderSelection === 'bottom' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
            }`}
          >
            아래
          </button>
          <button
            onClick={() => setBorderSelection('left')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderSelection === 'left' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
            }`}
          >
            왼쪽
          </button>
          <button
            onClick={() => setBorderSelection('right')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderSelection === 'right' ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
            }`}
          >
            오른쪽
          </button>
        </div>
      </div>

      {/* 테두리 스타일 */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1">테두리 스타일:</label>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setBorderStyle('solid')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderStyle === 'solid' ? 'bg-gray-100 border-gray-400' : ''
            }`}
          >
            실선
          </button>
          <button
            onClick={() => setBorderStyle('none')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderStyle === 'none' ? 'bg-gray-100 border-gray-400' : ''
            }`}
          >
            없음
          </button>
          <button
            onClick={() => setBorderStyle('dotted')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderStyle === 'dotted' ? 'bg-gray-100 border-gray-400' : ''
            }`}
          >
            도트
          </button>
          <button
            onClick={() => setBorderStyle('double')}
            className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
              borderStyle === 'double' ? 'bg-gray-100 border-gray-400' : ''
            }`}
          >
            이중선
          </button>
        </div>
      </div>

      {/* 테두리 굵기 */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1">굵기:</label>
        <div className="grid grid-cols-4 gap-1">
          {['1px', '2px', '3px', '4px'].map((width) => (
            <button
              key={width}
              onClick={() => setBorderWidth(width as '1px' | '2px' | '3px' | '4px')}
              className={`px-2 py-1 text-xs border rounded hover:bg-gray-50 ${
                borderWidth === width ? 'bg-blue-100 border-blue-300 text-blue-700' : ''
              }`}
            >
              {width}
            </button>
          ))}
        </div>
      </div>

      {/* 테두리 색상 */}
      <div className="mb-4">
        <label className="block text-xs text-gray-600 mb-1">색상:</label>
        <input
          type="color"
          value={borderColor}
          onChange={(e) => setBorderColor(e.target.value)}
          className="w-full h-6 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      {/* 적용 버튼 */}
      <button
        onClick={applyBorderToSelection}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-sm"
      >
        ✨ 테두리 적용
      </button>

      {/* 셀 배경색 */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">셀 배경색</h5>
        <input
          type="color"
          defaultValue="#ffffff"
          onChange={(e) => {
            editor?.chain().focus().setCellAttribute('backgroundColor', e.target.value).run();
            toast.success('셀 배경색이 변경되었습니다!');
          }}
          className="w-full h-6 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      {/* 전체 삭제 */}
      <div className="pt-3 border-t">
        <button
          onClick={() => {
            if (confirm('표를 완전히 삭제하시겠습니까?')) {
              editor?.chain().focus().deleteTable().run();
              onClose();
            }
          }}
          className="w-full px-3 py-2 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100 border border-red-200"
        >
          🗑️ 표 삭제
        </button>
      </div>

      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded"
      >
        ✕
      </button>
    </div>
  );
}