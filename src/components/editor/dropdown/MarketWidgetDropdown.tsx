"use client";

import React from 'react';
import { Editor } from '@tiptap/react';
import { createRoot } from 'react-dom/client';
import SymbolSelectModal from '../modals/SymbolSelectModal';

interface MarketWidgetDropdownProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MarketWidgetDropdown({ editor, isOpen, onClose }: MarketWidgetDropdownProps) {
  if (!isOpen) return null;

  const openSymbolModal = (type: 'coins' | 'exchanges') => {
    if (!editor) return;

    // 모달 컨테이너 생성
    const modalContainer = document.createElement('div');
    document.body.appendChild(modalContainer);
    const root = createRoot(modalContainer);

    const handleClose = () => {
      root.unmount();
      setTimeout(() => {
        if (modalContainer.parentNode) {
          modalContainer.parentNode.removeChild(modalContainer);
        }
      }, 0);
    };

    const handleConfirm = (symbols: string[]) => {
      editor
        .chain()
        .focus()
        .insertMarketWidget({ type, symbols })
        .run();
      handleClose();
    };

    root.render(
      React.createElement(SymbolSelectModal, {
        isOpen: true,
        onClose: handleClose,
        onConfirm: handleConfirm,
        type: type,
      })
    );

    onClose();
  };

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-md border border-gray-100 py-1 z-20 w-48">
      <button
        onClick={() => openSymbolModal('coins')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        암호화폐
      </button>
      <button
        onClick={() => openSymbolModal('exchanges')}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors"
      >
        환율
      </button>
    </div>
  );
}
