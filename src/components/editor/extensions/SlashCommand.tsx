import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { CommandsList, CommandItem } from '../CommandsList';
import { createRoot } from 'react-dom/client';
import React from 'react';
import SymbolSelectModal from '../SymbolSelectModal';
import PollConfigModal from '../PollConfigModal';
import ChartDialog from '../ChartDialog';

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: any; range: any; props: any }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const getSuggestionItems = ({ query, editor, onImageUpload, onAIButtonClick }: {
  query: string;
  editor: any;
  onImageUpload?: (file: File) => Promise<string>;
  onAIButtonClick?: () => void;
}): CommandItem[] => {
  const items: CommandItem[] = [
    {
      title: 'AI 글쓰기',
      icon: '✨',
      description: 'AI로 내용을 작성하거나 개선합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).run();
        if (onAIButtonClick) {
          onAIButtonClick();
        }
      },
    },
    {
      title: '줄 바꿈',
      icon: '↵',
      description: '줄 바꿈을 삽입합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHardBreak()
          .run();
      },
    },
    {
      title: '이미지',
      icon: '🖼️',
      description: '이미지를 삽입합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).run();

        // 파일 선택 다이얼로그 트리거
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true; // 다중 선택 활성화
        input.onchange = async (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0 && onImageUpload) {
            // 모든 파일을 순차적으로 업로드
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              try {
                const url = await onImageUpload(file);
                // 각 이미지를 HTML로 삽입하여 덮어쓰기 방지
                editor.chain().focus().insertContent(`<img src="${url}" style="display: inline-block; max-width: 100%; height: auto;" /><p></p>`).run();
              } catch (error) {
                console.error(`이미지 업로드 실패: ${file.name}`, error);
              }
            }
          }
        };
        input.click();
      },
    },
    {
      title: '구분선',
      icon: '—',
      description: '수평 구분선을 삽입합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        // 서브메뉴가 있으므로 기본 동작 없음
      },
      submenu: [
        {
          title: '짧은 기본선',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setHorizontalRule({ class: 'divider-short' })
              .run();
          },
        },
        {
          title: '긴 기본선',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setHorizontalRule({ class: 'divider-long' })
              .run();
          },
        },
        {
          title: '짧은 두꺼운선',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setHorizontalRule({ class: 'divider-thick' })
              .run();
          },
        },
        {
          title: '점선',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setHorizontalRule({ class: 'divider-dashed' })
              .run();
          },
        },
        {
          title: '세로 선',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .setHorizontalRule({ class: 'divider-vertical' })
              .run();
          },
        },
      ],
    },
    {
      title: '인용구',
      icon: '💬',
      description: '인용 블록을 삽입합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        // 서브메뉴가 있으므로 기본 동작 없음
      },
      submenu: [
        {
          title: '따옴표',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleBlockquote()
              .updateAttributes('blockquote', { class: 'quote-style-1' })
              .run();
          },
        },
        {
          title: '버티컬라인',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleBlockquote()
              .updateAttributes('blockquote', { class: 'quote-style-2' })
              .run();
          },
        },
        {
          title: '말풍선',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleBlockquote()
              .updateAttributes('blockquote', { class: 'quote-style-3' })
              .run();
          },
        },
        {
          title: '라인&따옴표',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleBlockquote()
              .updateAttributes('blockquote', { class: 'quote-style-4' })
              .run();
          },
        },
        {
          title: '프레임',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .toggleBlockquote()
              .updateAttributes('blockquote', { class: 'quote-style-6' })
              .run();
          },
        },
      ],
    },
    {
      title: '시장 위젯',
      icon: '📊',
      description: '실시간 코인/환율 정보를 표시합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        // 서브메뉴가 있으므로 기본 동작 없음
      },
      submenu: [
        {
          title: '암호화폐',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor.chain().focus().deleteRange(range).run();

            // 모달 컨테이너 생성
            const modalContainer = document.createElement('div');
            document.body.appendChild(modalContainer);
            const root = createRoot(modalContainer);

            const handleClose = () => {
              root.unmount();
              // DOM에서 안전하게 제거
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
                .insertMarketWidget({ type: 'coins', symbols })
                .run();
              handleClose();
            };

            root.render(
              React.createElement(SymbolSelectModal, {
                isOpen: true,
                onClose: handleClose,
                onConfirm: handleConfirm,
                type: 'coins',
              })
            );
          },
        },
        {
          title: '환율',
          command: ({ editor, range }: { editor: any; range: any }) => {
            editor.chain().focus().deleteRange(range).run();

            // 모달 컨테이너 생성
            const modalContainer = document.createElement('div');
            document.body.appendChild(modalContainer);
            const root = createRoot(modalContainer);

            const handleClose = () => {
              root.unmount();
              // DOM에서 안전하게 제거
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
                .insertMarketWidget({ type: 'exchanges', symbols })
                .run();
              handleClose();
            };

            root.render(
              React.createElement(SymbolSelectModal, {
                isOpen: true,
                onClose: handleClose,
                onConfirm: handleConfirm,
                type: 'exchanges',
              })
            );
          },
        },
      ],
    },
    {
      title: '투표',
      icon: '🗳️',
      description: '투표/설문조사를 삽입합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).run();

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

        const handleConfirm = (config: any) => {
          (editor as any).chain().focus().insertPoll(config).run();
          handleClose();
        };

        root.render(
          React.createElement(PollConfigModal, {
            isOpen: true,
            onClose: handleClose,
            onConfirm: handleConfirm,
          })
        );
      },
    },
    {
      title: '차트',
      icon: '📈',
      description: '차트/그래프를 삽입합니다',
      command: ({ editor, range }: { editor: any; range: any }) => {
        editor.chain().focus().deleteRange(range).run();

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

        const handleInsert = (chartType: 'bar' | 'line' | 'pie' | 'area', data: any[], title: string, units: Record<string, string>, colors: Record<string, string>) => {
          (editor as any).chain().focus().insertChart({ chartType, data, title, units, colors }).run();
          handleClose();
        };

        root.render(
          React.createElement(ChartDialog, {
            isOpen: true,
            onClose: handleClose,
            onInsert: handleInsert,
          })
        );
      },
    },
  ];

  return items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );
};

export const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: TippyInstance[] | null = null;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(CommandsList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
        theme: 'light',
      });
    },

    onUpdate(props: any) {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup?.[0]?.setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        popup?.[0]?.hide();
        return true;
      }

      return (component?.ref as any)?.onKeyDown?.(props);
    },

    onExit() {
      popup?.[0]?.destroy();
      component?.destroy();
    },
  };
};
