"use client";

import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { Smile, X } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CustomEmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  isOpen,
  onClose
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지로 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiSelect(emojiData.emoji);
    // 이모지 선택 후 자동으로 닫지 않음 (연속 선택 가능)
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-4 z-20 w-80">
      {/* 인기 이모지들 */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">🔥 인기 이모지</div>
        <div className="grid grid-cols-8 gap-2 mb-3">
          {[
            '😂', '😭', '🥺', '😍', '🤔', '💀', '🔥', '✨',
            '👑', '💯', '🤡', '😤', '😎', '🤗', '🙄', '😏',
            '💜', '❤️', '🖤', '💙', '🤍', '💚', '💛', '🧡',
            '👀', '💔', '🤝', '🙏', '✌️', '👏', '💪', '🤞'
          ].map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                if (onEmojiSelect) {
                  onEmojiSelect(emoji);
                }
              }}
              className="w-8 h-8 text-lg rounded hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110"
              title={`${emoji} 삽입`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 전체 이모지 픽커 */}
      <div className="border-t pt-3">
        <div className="text-xs text-gray-400 mb-2">전체 이모지</div>
        <div className="h-64 overflow-hidden">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchDisabled={false}
            skinTonesDisabled={false}
            previewConfig={{
              showPreview: false
            }}
            height={250}
            width={288}
            lazyLoadEmojis={true}
            searchPlaceholder="이모지 검색..."
          />
        </div>
      </div>

      {/* 빠른 닫기 버튼 */}
      <div className="text-center mt-3 pt-3 border-t">
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default CustomEmojiPicker;