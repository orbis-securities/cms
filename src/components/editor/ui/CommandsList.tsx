"use client";

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface SubMenuItem {
  title: string;
  icon?: string;
  command: (props: any) => void;
}

export interface CommandItem {
  title: string;
  icon: string;
  description: string;
  command: (props: any) => void;
  submenu?: SubMenuItem[];
}

interface CommandsListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const CommandsList = forwardRef<any, CommandsListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const selectItem = (index: number, subItem?: SubMenuItem) => {
    const item = props.items[index];
    if (item) {
      if (subItem) {
        subItem.command(props);
      } else if (item.submenu) {
        // 서브메뉴가 있으면 토글
        setExpandedIndex(expandedIndex === index ? null : index);
      } else {
        props.command(item);
      }
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="slash-commands-menu py-2 px-1 max-h-80 overflow-y-auto">
      {props.items.length > 0 ? (
        props.items.map((item, index) => (
          <div key={index}>
            <button
              className={`flex items-center w-full px-3 py-2 text-left rounded-md transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => selectItem(index)}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.title}</div>
              </div>
              {item.submenu && (
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${expandedIndex === index ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {item.submenu && expandedIndex === index && (
              <div className="ml-8 mt-1 mb-1 space-y-1">
                {item.submenu.map((subItem, subIndex) => (
                  <button
                    key={subIndex}
                    className="flex items-center w-full px-3 py-1.5 text-left rounded-md transition-colors text-gray-600 hover:bg-gray-50 text-sm"
                    onClick={() => selectItem(index, subItem)}
                  >
                    {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                    {subItem.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500">명령어를 찾을 수 없습니다</div>
      )}
    </div>
  );
});

CommandsList.displayName = 'CommandsList';
