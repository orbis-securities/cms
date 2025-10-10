import Image from '@tiptap/extension-image';

export const ResizableImage = Image.extend({
  name: 'resizableImage',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: element => {
          const width = element.style.width || element.getAttribute('width');
          return width ? parseInt(width) : null;
        },
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      align: {
        default: 'left',
        parseHTML: element => {
          return element.getAttribute('data-align') || element.parentElement?.getAttribute('data-align') || 'left';
        },
        renderHTML: attributes => {
          return {
            'data-align': attributes.align || 'left',
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const align = node.attrs.align || 'left';
    const width = node.attrs.width;

    let imgStyle = 'max-width: 100%; height: auto; display: inline-block;';
    if (width) {
      imgStyle += ` width: ${width}px;`;
    }

    let wrapperStyle = 'display: block; max-width: 100%;';
    if (align === 'center') {
      wrapperStyle += ' text-align: center;';
    } else if (align === 'right') {
      wrapperStyle += ' text-align: right;';
    } else {
      wrapperStyle += ' text-align: left;';
    }

    return [
      'div',
      {
        style: wrapperStyle,
        'data-align': align,
        class: 'image-wrapper'
      },
      [
        'img',
        {
          ...HTMLAttributes,
          style: imgStyle,
        },
      ],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
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
        update: (updatedNode) => {
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
