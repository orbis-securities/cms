'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface DividerToolbarPortalProps {
  editor: Editor;
}

export function DividerToolbarPortal({ editor }: DividerToolbarPortalProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedHrPos, setSelectedHrPos] = useState<number | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'HR') {
        const rect = target.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY - 50,
          left: rect.left + rect.width / 2 + window.scrollX,
        });

        // ProseMirror의 posAtDOM을 사용하여 정확한 위치 찾기
        try {
          const pos = editor.view.posAtDOM(target, 0);
          const node = editor.state.doc.nodeAt(pos);

          if (node && node.type.name === 'horizontalRule') {
            setSelectedHrPos(pos);
          } else {
            // 노드가 정확히 매칭되지 않으면 주변 검색
            let foundPos = null;
            editor.state.doc.descendants((node, nodePos) => {
              if (node.type.name === 'horizontalRule' && Math.abs(nodePos - pos) <= 2) {
                foundPos = nodePos;
                return false;
              }
            });
            if (foundPos !== null) {
              setSelectedHrPos(foundPos);
            }
          }
        } catch (error) {
          console.error('HR 위치 찾기 실패:', error);
        }
      } else {
        setPosition(null);
        setSelectedHrPos(null);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [editor]);

  const updateAlignment = (align: 'left' | 'center' | 'right') => {
    if (selectedHrPos !== null) {
      const node = editor.state.doc.nodeAt(selectedHrPos);

      if (node && node.type.name === 'horizontalRule') {
        console.log('구분선 정렬 업데이트:', { pos: selectedHrPos, align, currentAttrs: node.attrs });

        editor.chain()
          .focus()
          .setNodeSelection(selectedHrPos)
          .updateAttributes('horizontalRule', { 'data-align': align })
          .run();

        // 툴바 숨기기
        setPosition(null);
        setSelectedHrPos(null);
      } else {
        console.error('구분선을 찾을 수 없음:', { selectedHrPos, node });
      }
    }
  };

  if (!position) return null;

  return createPortal(
    <div
      className="fixed z-50 flex items-center gap-1 p-2 bg-white border rounded-lg shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        onClick={() => updateAlignment('left')}
        className="p-2 rounded hover:bg-gray-100"
        title="왼쪽 정렬"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        onClick={() => updateAlignment('center')}
        className="p-2 rounded hover:bg-gray-100"
        title="가운데 정렬"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        onClick={() => updateAlignment('right')}
        className="p-2 rounded hover:bg-gray-100"
        title="오른쪽 정렬"
      >
        <AlignRight className="w-4 h-4" />
      </button>
    </div>,
    document.body
  );
}
