"use client";

import React, { useState, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Trash2, Edit3, Square, Circle } from 'lucide-react';

interface ImageToolbarProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onDelete: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right') => void;
  onResize: (width: number) => void;
  onApplyEffect: (effect: 'shadow' | 'border' | 'rounded', enabled: boolean) => void;
  currentWidth?: number;
  currentAlignment?: 'left' | 'center' | 'right';
}

const ImageToolbar: React.FC<ImageToolbarProps> = ({
  isVisible,
  position,
  onDelete,
  onAlign,
  onResize,
  onApplyEffect,
  currentWidth = 400,
  currentAlignment = 'left'
}) => {
  const [width, setWidth] = useState(currentWidth);

  useEffect(() => {
    setWidth(currentWidth);
  }, [currentWidth]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    onResize(newWidth);
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
            onClick={() => onAlign('left')}
            className={`flex-1 p-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${
              currentAlignment === 'left'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlignLeft className="w-3 h-3" />
            왼쪽
          </button>
          <button
            onClick={() => onAlign('center')}
            className={`flex-1 p-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${
              currentAlignment === 'center'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlignCenter className="w-3 h-3" />
            가운데
          </button>
          <button
            onClick={() => onAlign('right')}
            className={`flex-1 p-2 rounded text-xs flex items-center justify-center gap-1 transition-colors ${
              currentAlignment === 'right'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <AlignRight className="w-3 h-3" />
            오른쪽
          </button>
        </div>
      </div>

      {/* 이미지 효과 */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-3 block">🎨 효과</label>
        <div className="space-y-2">
          <button
            onClick={() => onApplyEffect('shadow', true)}
            className="w-full p-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Square className="w-4 h-4" />
            그림자 추가
          </button>
          <button
            onClick={() => onApplyEffect('border', true)}
            className="w-full p-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Square className="w-4 h-4" />
            외곽선 추가
          </button>
          <button
            onClick={() => onApplyEffect('rounded', true)}
            className="w-full p-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Circle className="w-4 h-4" />
            둥근 모서리
          </button>
        </div>
      </div>

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