"use client";

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import suneditor from 'suneditor';
import plugins from 'suneditor/src/plugins';
import 'suneditor/dist/css/suneditor.min.css';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface SunEditorWrapperProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  selectedBlog?: string;
  availableBlogs?: { blogId: string; displayName: string }[];
  onBlogChange?: (blogId: string) => void;
  getDesignSettings?: (blogId: string) => Promise<any>;
  className?: string;
  onSetFeatured?: (imageUrl: string) => void;
  featuredImage?: string;
  simpleMode?: boolean;
}

export interface SunEditorWrapperRef {
  chain: () => unknown | undefined;
  getHTML?: () => string;
  clearContent?: () => void;
}

const SunEditorWrapper = forwardRef<SunEditorWrapperRef, SunEditorWrapperProps>(
  (props, ref) => {
    const {
      initialContent = '',
      onSave,
      onSetFeatured,
      className,
    } = props;

    const txtArea = useRef<HTMLTextAreaElement>(null);
    const editorInstance = useRef<any>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
    const editorReady = useRef(false);
    const lastLoadedContent = useRef<string>(''); // 마지막으로 로드된 콘텐츠 추적

    useEffect(() => {
      if (!txtArea.current) return;

      // SunEditor 생성
      const editor = suneditor.create(txtArea.current, {
        plugins: plugins,
        height: 'auto',
        minHeight: '500px',
        width: '100%',
        resizingBar: false,
        formats: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'],
        charCounter: false,
        charCounterLabel: '',
        fontSize: [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
        attributesWhitelist: {
          all: 'style',
          img: 'data-featured-image|data-align',
          div: 'data-align',
        },
        buttonList: [
          ['undo', 'redo'],
          ['font', 'fontSize', 'formatBlock'],
          ['bold', 'underline', 'italic', 'strike'],
          ['fontColor', 'hiliteColor'],
          ['removeFormat'],
          ['outdent', 'indent'],
          ['align', 'horizontalRule', 'list', 'lineHeight'],
          ['table', 'link', 'image', 'video'],
          ['fullScreen', 'showBlocks', 'codeView'],
          ['preview'],
        ],
      });

      // 이미지 업로드 핸들러
      editor.onImageUploadBefore = (files: any, info: any, core: any) => {
        const file = files[0];
        if (!file) return false;

        // Base64로 변환
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          // 이미지 HTML 직접 삽입
          editor.insertHTML(`<img src="${base64}" alt="${file.name}" />`);
          toast.success('이미지가 삽입되었습니다.');
        };
        reader.onerror = () => {
          toast.error('이미지 삽입에 실패했습니다.');
        };
        reader.readAsDataURL(file);

        return false; // Prevent default upload behavior
      };

      editorInstance.current = editor;

      // 에디터가 완전히 준비될 때까지 대기 후 플래그 설정
      setTimeout(() => {
        editorReady.current = true;
        console.log('🟢 에디터 준비 완료, initialContent:', initialContent ? `있음 (${initialContent.length}자)` : '없음');
        // 에디터 준비 완료 후 초기 내용 설정
        if (initialContent && editorInstance.current && lastLoadedContent.current !== initialContent) {
          console.log('📝 초기 콘텐츠 설정 시작');
          try {
            editorInstance.current.setContents(initialContent);
            lastLoadedContent.current = initialContent;
            console.log('✅ 초기 콘텐츠 설정 완료');
          } catch (error) {
            console.error('❌ 초기 콘텐츠 설정 실패:', error);
          }
        } else {
          console.log('⏭️ 초기 콘텐츠 설정 스킵 (동일한 콘텐츠)');
        }
      }, 300);

      // 툴바에 이모지 버튼 추가
      const addEmojiButton = () => {
        const toolbar = document.querySelector('.se-toolbar');
        if (!toolbar) return false;

        // 이미 추가되어 있으면 skip
        if (toolbar.querySelector('[data-custom="emoji"]')) return true;

        // 마지막 버튼 그룹 찾기
        const buttonGroups = toolbar.querySelectorAll('.se-btn-module');
        const lastGroup = buttonGroups[buttonGroups.length - 1];
        if (!lastGroup) return false;

        // 이모지 버튼 생성
        const emojiBtn = document.createElement('button');
        emojiBtn.type = 'button';
        emojiBtn.className = 'se-btn se-tooltip';
        emojiBtn.setAttribute('data-custom', 'emoji');
        emojiBtn.style.cssText = 'display:inline-flex!important;align-items:center;justify-content:center;padding:4px;background:transparent;border:none;cursor:pointer;width:34px;height:34px;';
        emojiBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm10 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-5 7c2.21 0 4-1.79 4-4h-8c0 2.21 1.79 4 4 4z"/>
          </svg>
          <span class="se-tooltip-inner"><span class="se-tooltip-text">이모지 추가</span></span>
        `;

        emojiBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowEmojiPicker(prev => !prev);
        };

        emojiButtonRef.current = emojiBtn;
        lastGroup.appendChild(emojiBtn);
        return true;
      };

      // 툴바 버튼 추가 시도
      const toolbarInterval = setInterval(() => {
        if (addEmojiButton()) {
          clearInterval(toolbarInterval);
        }
      }, 100);

      // 이미지 컨트롤러에 featured 버튼 추가
      const interval = setInterval(() => {
        const controller = document.querySelector('.se-controller-resizing') as HTMLElement;
        if (!controller) return;

        const btnGroups = controller.querySelectorAll('.se-btn-group');
        const targetGroup = btnGroups[1];
        if (!targetGroup) return;

        // 이미 버튼이 있으면 추가하지 않음
        const existingBtn = controller.querySelector('[data-custom="featured"]');
        if (existingBtn) return;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'se-btn se-tooltip';
        btn.setAttribute('data-custom', 'featured');
        btn.style.cssText = 'display:inline-flex!important;align-items:center;justify-content:center;padding:4px;background:transparent;color:#f59e0b;border:none;cursor:pointer;width:34px;height:34px;';
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="#f59e0b" width="20" height="20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span class="se-tooltip-inner"><span class="se-tooltip-text">타이틀 이미지로 설정</span></span>';

        btn.onclick = () => {
          console.log('=== 타이틀 이미지 설정 시작 ===');

          // 브라우저 표준 API로 현재 선택된 요소 확인
          const selection = window.getSelection();
          const currentElement = selection?.focusNode?.parentElement;
          console.log('현재 선택된 노드:', currentElement);

          // 리사이징 컨트롤러의 위치 가져오기
          const controllerRect = controller.getBoundingClientRect();
          const controllerCenterX = controllerRect.left + controllerRect.width / 2;
          const controllerCenterY = controllerRect.top + controllerRect.height / 2;

          console.log('컨트롤러 위치:', { x: controllerCenterX, y: controllerCenterY });

          // 모든 float 컨테이너 찾기 (querySelector는 첫번째만 반환하므로 querySelectorAll 사용)
          const allContainers = document.querySelectorAll('.sun-editor-editable .__se__float-left, .sun-editor-editable .__se__float-right, .sun-editor-editable .__se__float-center, .sun-editor-editable .__se__float-none');

          console.log('찾은 float 컨테이너 개수:', allContainers.length);

          let targetImage: Element | null = null;
          let minDistance = Infinity;

          // 각 컨테이너의 위치를 확인해서 컨트롤러와 가장 가까운 것 찾기
          allContainers.forEach((container, idx) => {
            const containerRect = container.getBoundingClientRect();
            const containerCenterX = containerRect.left + containerRect.width / 2;
            const containerCenterY = containerRect.top + containerRect.height / 2;

            const distance = Math.sqrt(
              Math.pow(containerCenterX - controllerCenterX, 2) +
              Math.pow(containerCenterY - controllerCenterY, 2)
            );

            console.log(`컨테이너 ${idx} 거리:`, distance);

            if (distance < minDistance) {
              minDistance = distance;
              targetImage = container.querySelector('img');
            }
          });

          console.log('최소 거리:', minDistance);
          console.log('선택된 이미지:', targetImage);

          // 에디터 내 모든 이미지 찾기
          const allImages = document.querySelectorAll('.sun-editor-editable img');
          console.log('에디터 내 전체 이미지 개수:', allImages.length);

          allImages.forEach((img, idx) => {
            const imgEl = img as HTMLImageElement;
            console.log(`이미지 ${idx}:`, {
              src: imgEl.src.substring(0, 50) + '...',
              width: imgEl.width,
              height: imgEl.height,
              className: imgEl.className,
              naturalWidth: imgEl.naturalWidth,
              naturalHeight: imgEl.naturalHeight
            });
          });

          if (!targetImage) {
            console.error('선택된 이미지를 찾을 수 없습니다');
            toast.error('이미지를 찾을 수 없습니다.');
            return;
          }

          const imageSrc = (targetImage as HTMLImageElement).src;
          console.log('최종 선택된 이미지 src (처음 100자):', imageSrc.substring(0, 100));

          let html = editor.getContents(false);

          // 모든 이미지에서 data-featured-image 속성 제거
          html = html.replace(/\s*data-featured-image\s*=\s*["']?true["']?/gi, '');
          html = html.replace(/\s*data-featured-image\s*/gi, '');

          // HTML에서 이미지 src 찾기 - 디버깅
          const imgMatches = html.match(/<img[^>]*src="([^"]*?)"[^>]*>/gi);
          console.log('HTML에서 찾은 이미지 개수:', imgMatches?.length);
          imgMatches?.forEach((match, idx) => {
            const srcMatch = match.match(/src="([^"]*?)"/);
            if (srcMatch) {
              console.log(`HTML 이미지 ${idx} src (처음 100자):`, srcMatch[1].substring(0, 100));
              console.log(`일치 여부:`, srcMatch[1] === imageSrc);
            }
          });

          // 선택된 이미지에 data-featured-image 속성 추가
          let found = false;
          let matchCount = 0;
          html = html.replace(/<img([^>]*?)src="([^"]*?)"([^>]*?)>/gi, (m: string, before: string, s: string, after: string) => {
            matchCount++;
            console.log(`정규식 매치 ${matchCount}: src 일치 여부 =`, s === imageSrc);
            if (s === imageSrc) {
              found = true;
              console.log('✅ 타이틀 이미지로 설정:', matchCount);
              return `<img data-featured-image="true"${before}src="${s}"${after}>`;
            }
            return m;
          });

          console.log('총 매치된 이미지 수:', matchCount);
          console.log('타이틀 이미지 찾음:', found);

          if (!found) {
            toast.error('이미지 설정에 실패했습니다. 다시 시도해주세요.');
            return;
          }

          editor.setContents(html);

          if (onSetFeatured) {
            onSetFeatured(imageSrc);
          }

          toast.success('타이틀 이미지로 설정되었습니다.');
        };

        const deleteBtn = targetGroup.querySelector('[data-command="delete"]');
        if (deleteBtn) {
          targetGroup.insertBefore(btn, deleteBtn);
        } else {
          targetGroup.appendChild(btn);
        }
      }, 100);

      return () => {
        editorReady.current = false;
        // lastLoadedContent는 리셋하지 않음 - 컴포넌트가 살아있는 동안 유지
        clearInterval(toolbarInterval);
        clearInterval(interval);
        if (editor) {
          editor.destroy();
        }
      };
    }, []);

    // initialContent가 변경되면 에디터 내용 업데이트
    useEffect(() => {
      if (!editorInstance.current || !editorReady.current) {
        console.log('⏳ 에디터 아직 준비 안됨');
        return;
      }

      if (initialContent !== lastLoadedContent.current) {
        console.log('🔄 콘텐츠 업데이트:', initialContent ? `${initialContent.length}자` : '빈 콘텐츠');
        try {
          editorInstance.current.setContents(initialContent || '');
          lastLoadedContent.current = initialContent;
          console.log('✅ 콘텐츠 업데이트 완료');
        } catch (error) {
          console.error('❌ 콘텐츠 업데이트 실패:', error);
        }
      } else {
        console.log('⏭️ 동일한 콘텐츠, 업데이트 스킵');
      }
    }, [initialContent]);

    // Ref 노출
    useImperativeHandle(
      ref,
      () => ({
        chain: () => undefined,
        getHTML: () => {
          if (editorInstance.current) {
            // 원본 HTML 반환 (SunEditor 구조 유지)
            return editorInstance.current.getContents(false);
          }
          return '';
        },
        clearContent: () => {
          if (editorInstance.current) {
            editorInstance.current.setContents('');
          }
        },
      }),
      []
    );

    // 이모지 선택 핸들러
    const handleEmojiClick = (emojiData: any) => {
      if (editorInstance.current) {
        // 유니코드 텍스트로 이모지 삽입
        editorInstance.current.insertHTML(emojiData.emoji);
      }
    };

    // 외부 클릭 시 이모지 피커 닫기
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const emojiPicker = document.querySelector('.emoji-picker-container');
        const emojiButton = emojiButtonRef.current;

        if (showEmojiPicker &&
            emojiPicker &&
            !emojiPicker.contains(target) &&
            emojiButton &&
            !emojiButton.contains(target)) {
          setShowEmojiPicker(false);
        }
      };

      if (showEmojiPicker) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [showEmojiPicker]);

    return (
      <div className={`w-full ${className}`} style={{ position: 'relative' }}>
        <textarea ref={txtArea} style={{ display: 'none' }} />

        {/* 이모지 피커 */}
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={350}
              height={450}
              searchPlaceholder="이모지 검색..."
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        <style jsx global>{`
          .sun-editor {
            height: auto !important;
            min-height: 500px !important;
          }
          .sun-editor .se-wrapper {
            height: auto !important;
            min-height: 500px !important;
          }
          .sun-editor .se-wrapper-inner {
            height: auto !important;
            min-height: 500px !important;
          }
          .sun-editor .se-wrapper-wysiwyg {
            min-height: 450px !important;
            height: auto !important;
            overflow-y: auto !important;
          }
          .sun-editor .se-resizing-bar {
            display: none !important;
          }

          /* 에디터 내부 정렬 기능 허용 */
          .sun-editor-editable {
            text-align: left;
          }
          .sun-editor-editable [style*="text-align"] {
            display: block !important;
          }

          /* 이미지 기본 스타일 - 검은 테두리 제거 */
          .sun-editor-editable img {
            border: none !important;
            outline: none !important;
          }

          /* 이모지 스타일 - 테두리 제거 */
          .sun-editor-editable img[alt*="emoji"],
          .sun-editor-editable span {
            border: none !important;
            outline: none !important;
            text-decoration: none !important;
          }

          /* 커스텀 버튼 스타일 */
          .se-btn[data-custom="featured"] {
            background-color: transparent !important;
            color: #f59e0b !important;
          }

          .se-btn[data-custom="featured"]:hover {
            background-color: #fef3c7 !important;
            color: #d97706 !important;
          }

          .se-btn[data-custom="featured"] svg {
            fill: currentColor !important;
          }

          /* 이모지 버튼 스타일 */
          .se-btn[data-custom="emoji"] {
            background-color: transparent !important;
            color: #666 !important;
          }

          .se-btn[data-custom="emoji"]:hover {
            background-color: #f3f4f6 !important;
            color: #111 !important;
          }

          .se-btn[data-custom="emoji"] svg {
            fill: currentColor !important;
          }

          /* 이모지 피커 컨테이너 */
          .emoji-picker-container {
            position: absolute;
            top: 60px;
            right: 20px;
            z-index: 10000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 8px;
            overflow: hidden;
          }
        `}</style>
      </div>
    );
  }
);

SunEditorWrapper.displayName = 'SunEditorWrapper';

export default SunEditorWrapper;
