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
        default: 400,  // 기본값을 400으로 설정하여 null 방지
        parseHTML: (element: HTMLElement) => {
          // data-width, width 속성, 또는 style에서 width 추출
          const dataWidth = element.getAttribute('data-width');
          const widthAttr = element.getAttribute('width');
          const styleWidth = element.style.width;

          if (dataWidth) return parseInt(dataWidth);
          if (widthAttr) return parseInt(widthAttr);
          if (styleWidth && styleWidth.includes('px')) {
            return parseInt(styleWidth);
          }
          return 400;  // 파싱 실패 시 기본값 반환
        },
        renderHTML: (attributes: any) => {
          const width = attributes.width || 400;
          return {
            'data-width': width,
            'width': width,
            'style': `width: ${width}px; max-width: 100%; height: auto;`,
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
      'data-featured-image': {
        default: null,
        parseHTML: (element: HTMLElement) => {
          return element.getAttribute('data-featured-image') || element.parentElement?.getAttribute('data-featured-image') || null;
        },
        renderHTML: (attributes: any) => {
          if (attributes['data-featured-image'] === 'true') {
            return {
              'data-featured-image': 'true',
            };
          }
          return {};
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }: { HTMLAttributes: Record<string, any>; node: any }) {
    const align = node.attrs.align || 'left';
    const width = node.attrs.width;
    const isFeatured = node.attrs['data-featured-image'] === 'true';

    // 이미지 속성 준비 - data-align을 img 태그에 명시적으로 추가
    const imgAttributes = {
      ...HTMLAttributes,
      'data-align': align,  // parseHTML에서 직접 읽을 수 있도록 img에 추가
      ...(width && {
        'data-width': width,
        'width': width,
        'style': `width: ${width}px; max-width: 100%; height: auto;`,
      }),
      ...(isFeatured && {
        'data-featured-image': 'true',
      }),
    };

    return [
      'div',
      {
        'data-align': align,
        ...(width && { 'data-width': width }),
        ...(isFeatured && { 'data-featured-image': 'true' }),
        class: 'image-wrapper'
      },
      [
        'img',
        imgAttributes,
      ],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }: { node: any; getPos: any; editor: any }) => {
      const container = document.createElement('div');
      const align = node.attrs.align || 'left';
      const isFeatured = node.attrs['data-featured-image'] === 'true';

      container.className = `image-resizer-container image-align-${align}`;
      container.setAttribute('data-align', align);

      if (isFeatured) {
        container.setAttribute('data-featured-image', 'true');
      }

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

      if (isFeatured) {
        img.setAttribute('data-featured-image', 'true');
      }

      const imageWidth = node.attrs.width || 400;  // 기본값 400px
      img.style.cssText = `
        width: ${imageWidth}px;
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

          const updatedWidth = updatedNode.attrs.width || 400;  // 기본값 400px
          img.style.width = `${updatedWidth}px`;

          // 정렬 업데이트
          const align = updatedNode.attrs.align || 'left';
          container.className = `image-resizer-container image-align-${align}`;
          container.setAttribute('data-align', align);

          // featured 상태 업데이트
          const isFeatured = updatedNode.attrs['data-featured-image'] === 'true';
          if (isFeatured) {
            container.setAttribute('data-featured-image', 'true');
            img.setAttribute('data-featured-image', 'true');
          } else {
            container.removeAttribute('data-featured-image');
            img.removeAttribute('data-featured-image');
          }

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
