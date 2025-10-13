import Image from '@tiptap/extension-image';

export const ResizableImage = Image.extend({
  name: 'resizableImage',

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('src'),
        renderHTML: (attributes: any) => {
          if (!attributes.src) {
            return {};
          }
          return { src: attributes.src };
        },
      },
      alt: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('alt'),
        renderHTML: (attributes: any) => {
          if (!attributes.alt) {
            return {};
          }
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('title'),
        renderHTML: (attributes: any) => {
          if (!attributes.title) {
            return {};
          }
          return { title: attributes.title };
        },
      },
      width: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const width = element.getAttribute('data-width') || element.getAttribute('width');
          return width ? parseInt(width) : null;
        },
        renderHTML: (attributes: any) => {
          if (!attributes.width) {
            return {};
          }
          return {
            'data-width': attributes.width,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-align') || element.parentElement?.getAttribute('data-align') || 'left';
        },
        renderHTML: (attributes: any) => {
          return {
            'data-align': attributes.align || 'left',
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }: { HTMLAttributes: Record<string, any>; node: any }) {
    const align = node.attrs.align || 'left';
    const width = node.attrs.width;

    // style 속성 제거 (class와 data 속성만 사용)
    const { style, ...cleanAttributes } = HTMLAttributes;

    return [
      'div',
      {
        'data-align': align,
        'data-width': width || null,
        class: 'image-wrapper'
      },
      [
        'img',
        cleanAttributes,
      ],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }: { node: any; getPos: any; editor: any }) => {
      const container = document.createElement('div');
      const align = node.attrs.align || 'left';
      container.className = `image-resizer-container image-align-${align}`;
      container.setAttribute('data-align', align);

      // 이미지 wrapper (리사이즈 핸들을 위한 position: relative 컨테이너)
      const imgWrapper = document.createElement('div');
      imgWrapper.style.cssText = `
        position: relative;
        display: inline-block;
        max-width: 100%;
      `;

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';

      const imageWidth = node.attrs.width ? `${node.attrs.width}px` : 'auto';
      img.style.cssText = `
        width: ${imageWidth};
        height: auto;
        max-width: 100%;
        cursor: default;
        display: block;
      `;

      // 리사이즈 핸들
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'resize-handle';
      resizeHandle.style.cssText = `
        position: absolute;
        right: 0;
        bottom: 0;
        width: 12px;
        height: 12px;
        background: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        cursor: nwse-resize;
        display: none;
        z-index: 10;
      `;

      let isResizing = false;
      let startX = 0;
      let startWidth = 0;

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startWidth = img.offsetWidth;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isResizing) return;

        const diff = e.clientX - startX;
        const newWidth = Math.max(100, Math.min(startWidth + diff, 800));

        img.style.width = `${newWidth}px`;
      };

      const onMouseUp = () => {
        if (!isResizing) return;

        isResizing = false;
        const newWidth = parseInt(img.style.width);

        if (typeof getPos === 'function') {
          const pos = getPos();
          editor.chain()
            .focus()
            .setNodeSelection(pos)
            .updateAttributes('resizableImage', { width: newWidth })
            .run();
        }

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      // 호버 효과
      imgWrapper.addEventListener('mouseenter', () => {
        resizeHandle.style.display = 'block';
        img.style.outline = '2px solid #3b82f6';
      });

      imgWrapper.addEventListener('mouseleave', () => {
        if (!isResizing) {
          resizeHandle.style.display = 'none';
          img.style.outline = 'none';
        }
      });

      resizeHandle.addEventListener('mousedown', onMouseDown);

      imgWrapper.appendChild(img);
      imgWrapper.appendChild(resizeHandle);
      container.appendChild(imgWrapper);

      return {
        dom: container,
        update: (updatedNode: any) => {
          if (updatedNode.type.name !== 'resizableImage') return false;

          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || '';

          const updatedWidth = updatedNode.attrs.width ? `${updatedNode.attrs.width}px` : 'auto';
          img.style.width = updatedWidth;

          // 정렬 업데이트
          const align = updatedNode.attrs.align || 'left';
          container.className = `image-resizer-container image-align-${align}`;
          container.setAttribute('data-align', align);

          return true;
        },
        destroy: () => {
          resizeHandle.removeEventListener('mousedown', onMouseDown);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        },
      };
    };
  },
});
