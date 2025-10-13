"use client";

import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Trash2, Edit3 } from 'lucide-react';

interface ImageToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onDelete: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right') => void;
  onResize: (width: number) => void;
  onSetFeatured?: (imageUrl: string) => void;
  currentWidth?: number;
  currentAlignment?: 'left' | 'center' | 'right';
  currentImageUrl?: string;
  isFeatured?: boolean;
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({
  isVisible,
  position,
  onDelete,
  onAlign,
  onResize,
  onSetFeatured,
  currentWidth = 400,
  currentAlignment = 'left',
  currentImageUrl = '',
  isFeatured = false
}) => {
  const [width, setWidth] = useState(currentWidth);
  const [alignment, setAlignment] = useState(currentAlignment);

  useEffect(() => {
    setWidth(currentWidth);
  }, [currentWidth]);

  useEffect(() => {
    setAlignment(currentAlignment);
  }, [currentAlignment]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    onResize(newWidth);
  };

  const handleAlignChange = (newAlign: 'left' | 'center' | 'right') => {
    setAlignment(newAlign);
    onAlign(newAlign);
  };

  if (!isVisible) return null;

  return (
    <div
      className="image-toolbar-panel fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-30 min-w-72"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 250)
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-semibold text-gray-900">이미지 편집</span>
        </div>
        <div className="text-xs text-gray-500">클릭하여 수정</div>
      </div>

      {/* 크기 조절 */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-3 block">📏 크기 조절</label>
        <div className="space-y-3">
          {/* 프리셋 크기 버튼들 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '작게', value: 200 },
              { label: '보통', value: 400 },
              { label: '크게', value: 600 }
            ].map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleWidthChange(preset.value)}
                className={`p-2 rounded text-xs transition-colors ${
                  Math.abs(width - preset.value) < 25
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {preset.label}
                <div className="text-xs text-gray-500">{preset.value}px</div>
              </button>
            ))}
          </div>

          {/* 세밀한 크기 조절 슬라이더 */}
          <div>
            <input
              type="range"
              min="100"
              max="800"
              step="25"
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100px</span>
              <span className="font-medium text-blue-600">{width}px</span>
              <span>800px</span>
            </div>
          </div>
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-3 block">📐 정렬</label>
        <div className="flex gap-1">
          <button
            onClick={() => handleAlignChange('left')}
            className={`flex-1 p-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${
              alignment === 'left'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlignLeft className="w-3 h-3" />
            왼쪽
          </button>
          <button
            onClick={() => handleAlignChange('center')}
            className={`flex-1 p-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${
              alignment === 'center'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlignCenter className="w-3 h-3" />
            가운데
          </button>
          <button
            onClick={() => handleAlignChange('right')}
            className={`flex-1 p-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${
              alignment === 'right'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlignRight className="w-3 h-3" />
            오른쪽
          </button>
        </div>
      </div>

      {/* 타이틀 이미지 설정 */}
      {onSetFeatured && (
        <div className="mb-3">
          <button
            onClick={() => onSetFeatured(currentImageUrl)}
            className={`w-full p-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${
              isFeatured
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-base">⭐</span>
            {isFeatured ? '타이틀 이미지로 설정됨' : '타이틀 이미지로 설정'}
          </button>
        </div>
      )}

      {/* 삭제 버튼 */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={onDelete}
          className="w-full p-3 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          이미지 삭제
        </button>
      </div>
    </div>
  );
};

export default ImageToolbar;