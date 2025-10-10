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

        // HR의 위치 찾기
        const editorElement = editor.view.dom;
        const hrs = editorElement.querySelectorAll('hr');
        let hrIndex = -1;
        hrs.forEach((hr, index) => {
          if (hr === target) hrIndex = index;
        });

        if (hrIndex >= 0) {
          // Document에서 HR 노드 찾기
          let found = false;
          let currentIndex = 0;
          editor.state.doc.descendants((node, pos) => {
            if (node.type.name === 'horizontalRule') {
              if (currentIndex === hrIndex) {
                setSelectedHrPos(pos);
                found = true;
                return false;
              }
              currentIndex++;
            }
          });
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
      const { tr } = editor.state;
      const node = editor.state.doc.nodeAt(selectedHrPos);

      if (node && node.type.name === 'horizontalRule') {
        tr.setNodeMarkup(selectedHrPos, null, {
          ...node.attrs,
          'data-align': align,
        });
        editor.view.dispatch(tr);
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
