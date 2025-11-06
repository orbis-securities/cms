"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdvancedNovelEditor, { AdvancedNovelEditorRef } from '@/components/editor/AdvancedNovelEditor';
import {
  Eye,
  Save,
  Send,
  FileText,
  X,
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';;
import SpellCheckPanel from '@/components/editor/SpellCheckPanel';
import CommonCodeSelect from '@/components/common/CommonCodeSelect';
import CategorySelect from '@/components/common/CategorySelect';
import Button from '@/components/common/Button';

function WritePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editPostId = searchParams.get('id');
  const editCategory = searchParams.get('category');
  const editBlogId = searchParams.get('blog');
  const isEditMode = !!editPostId; // postId만 있으면 수정 모드

  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(editBlogId || '');
  const [category, setCategory] = useState(editCategory || '');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSpellCheck, setShowSpellCheck] = useState(false);
  const [featuredImage, setFeaturedImage] = useState('');
  const [langType, setLangType] = useState('ko');
  const [postStatus, setPostStatus] = useState<'draft' | 'published'>('draft');
  const [postSlug, setPostSlug] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [initialCategoryId, setInitialCategoryId] = useState<string>(''); // 초기 카테고리 ID (수정 모드용)
  const editorRef = useRef<AdvancedNovelEditorRef>(null);

  // 블로그 목록은 CommonCodeSelect에서 자동으로 처리됨

  // 템플릿에서 내용 불러오기
  useEffect(() => {
    const templateContent = localStorage.getItem('templateContent');
    if (templateContent && !isEditMode) {
      setPostContent(templateContent);
      // 사용 후 제거
      localStorage.removeItem('templateContent');
    }
  }, [isEditMode]);

  // 수정 모드일 때 포스트 데이터 로드
  useEffect(() => {
    const loadPostForEdit = async () => {
      if (isEditMode && editPostId) {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('authToken');
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/getPost?postId=${editPostId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.code === "S" && data.result?.post) {
            const post = data.result.post;

            // 기본 정보 설정
            setPostTitle(post.title || '');
            setPostDescription(post.description || '');
            setPostContent(post.content || '');
            setTags(post.tags || '');
            setLangType(post.langType || 'ko');
            setPostStatus(post.status || 'draft');
            setPostSlug(post.slug || '');

            // SEO 설정
            setMetaTitle(post.seo?.metaTitle || '');
            setMetaDescription(post.seo?.metaDescription || '');
            setKeywords(Array.isArray(post.seo?.keywords) ? post.seo.keywords.join(', ') : (post.seo?.keywords || ''));

            // 타이틀 이미지 설정
            if (post.featuredImage) {
              setFeaturedImage(post.featuredImage);
            }

            // 블로그와 카테고리 설정
            if (post.blogId) {
              setSelectedBlog(post.blogId);
            }
            if (post.categoryId) {
              setInitialCategoryId(post.categoryId); // CategorySelect에서 처리
            }
          } else {
            console.warn('⚠️ 포스트를 찾을 수 없음');
            toast.error('포스트를 찾을 수 없습니다.');
          }
        } catch (error) {
          console.error('❌ 포스트 로드 실패:', error);
          toast.error('포스트를 불러오는데 실패했습니다.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPostForEdit();
  }, [isEditMode, editPostId]);

  // 전체 페이지 기본 드래그 방지 (단, 우리 업로드 영역과 에디터는 제외)
  useEffect(() => {
    const handlePageDragOver = (e: DragEvent) => {
      // 우리 업로드 영역이나 에디터가 아닌 곳에서만 방지
      const target = e.target as HTMLElement;
      if (!target.closest('[data-upload-area]') && !target.closest('.ProseMirror')) {
        e.preventDefault();
      }
    };
    const handlePageDrop = (e: DragEvent) => {
      // 우리 업로드 영역이나 에디터가 아닌 곳에서만 방지
      const target = e.target as HTMLElement;
      if (!target.closest('[data-upload-area]') && !target.closest('.ProseMirror')) {
        e.preventDefault();
      }
    };

    document.addEventListener('dragover', handlePageDragOver);
    document.addEventListener('drop', handlePageDrop);

    return () => {
      document.removeEventListener('dragover', handlePageDragOver);
      document.removeEventListener('drop', handlePageDrop);
    };
  }, []);

  const handleSave = (content: string) => {
    // 자동 저장 비활성화 (수동으로만 저장)
    setPostContent(content);
  };

  // HTML에서 poll 데이터 추출 (여러 개)
  const extractPollsDataFromHTML = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const pollElements = doc.querySelectorAll('[data-type="poll"]');

    if (pollElements.length === 0) {
      return [];
    }

    const polls: Array<{
      pollId: string;
      question: string;
      options: { text: string; votes: number }[];
      allowMultiple: boolean;
      totalVotes: number;
    }> = [];

    pollElements.forEach((pollElement) => {
      const pollId = pollElement.getAttribute('data-poll-id') || '';
      const question = pollElement.getAttribute('data-question') || '';
      const optionsStr = pollElement.getAttribute('data-options');
      const allowMultiple = pollElement.getAttribute('data-allow-multiple') === 'true';

      let options: { text: string; votes: number }[] = [];
      try {
        const parsed = optionsStr ? JSON.parse(optionsStr) : [];
        // PollExtension에서 string[] 형식으로 저장되므로, { text, votes } 형식으로 변환
        options = parsed.map((opt: string | { text: string; votes: number }) => {
          if (typeof opt === 'string') {
            return { text: opt, votes: 0 };
          }
          return opt;
        });
      } catch (error) {
        console.error('Poll 옵션 파싱 실패:', error);
        options = [];
      }

      // 새로 등록되는 poll은 항상 totalVotes = 0으로 초기화
      const totalVotes = 0;

      if (pollId) {
        polls.push({
          pollId,
          question,
          options,
          allowMultiple,
          totalVotes
        });
      }
    });

    return polls;
  };

  // 타이틀 이미지와 일치하는 img 태그에 속성 추가
  const addFeaturedImageAttributes = (htmlContent: string, featuredImageUrl: string) => {
    if (!featuredImageUrl) {
      // featuredImageUrl이 없으면 모든 data-featured-image 속성 제거
      return htmlContent.replace(/\s*data-featured-image="true"/g, '');
    }

    // 정규식으로 img 태그를 찾아서 속성 추가
    return htmlContent.replace(/<img([^>]*?)>/gi, (match, attributes) => {
      // src 속성에서 URL 추출
      const srcMatch = attributes.match(/src="([^"]*)"/);
      const imgSrc = srcMatch ? srcMatch[1] : '';

      // 먼저 기존 data-featured-image 속성 제거
      const cleanedAttributes = attributes.replace(/\s*data-featured-image="true"/g, '');

      // featuredImageUrl과 일치하면 data-featured-image 속성을 img 태그 바로 뒤에 추가
      if (imgSrc === featuredImageUrl) {
        return `<img data-featured-image="true"${cleanedAttributes}>`;
      }

      return `<img${cleanedAttributes}>`;
    });
  };

  // 게시글 생성 함수
  const createPost = async (status: 'draft' | 'published') => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    let editorContent = editorRef.current?.getHTML?.() || postContent;
    editorContent = addFeaturedImageAttributes(editorContent, featuredImage);
    const pollsData = extractPollsDataFromHTML(editorContent);

    const requestBody = {
      blogId: selectedBlog,
      categoryId: category,
      title: postTitle,
      description: postDescription,
      content: editorContent,
      langType: langType,
      tags: tags,
      status: status,
      seoTitle: metaTitle || postTitle,
      seoDescription: metaDescription,
      seoKeywords: keywords,
      ...(pollsData.length > 0 && { polls: pollsData })
    };

    console.log(`📤 포스트 ${status === 'draft' ? '저장' : '발행'} 요청:`, requestBody);

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/createPost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log('📡 API 응답:', result);

    if (!response.ok || result.code !== 'S') {
      throw new Error(result.message || '포스트 저장에 실패했습니다.');
    }

    return result;
  };

  // 게시글 수정 함수
  const updatePost = async (status: 'draft' | 'published') => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    let editorContent = editorRef.current?.getHTML?.() || postContent;
    editorContent = addFeaturedImageAttributes(editorContent, featuredImage);
    const pollsData = extractPollsDataFromHTML(editorContent);

    // draft → published 변경 시에만 publishedBy 추가
    const isDraftToPublished = postStatus === 'draft' && status === 'published';
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr)?.id : null;

    const requestBody = {
      blogId: selectedBlog,
      postId: editPostId,
      categoryId: category,
      title: postTitle,
      description: postDescription,
      content: editorContent,
      langType: langType,
      tags: tags,
      status: status,
      seoTitle: metaTitle || postTitle,
      seoDescription: metaDescription,
      seoKeywords: keywords,
      ...(pollsData.length > 0 && { polls: pollsData }),
      ...(isDraftToPublished && userId && { publishedBy: userId })
    };

    console.log(`📤 포스트 ${status === 'draft' ? '수정 저장' : '수정 발행'} 요청:`, requestBody);

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/updatePost`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    console.log('📡 API 응답:', result);

    if (!response.ok || result.code !== 'S') {
      throw new Error(result.message || '포스트 수정에 실패했습니다.');
    }

    return result;
  };

  const handleSaveAsDraft = async () => {
    // 유효성 검사
    if (!postTitle.trim()) {
      toast.info('제목을 입력해주세요', { position: 'top-center' });
      return;
    }
    const editorContent = editorRef.current?.getHTML?.() || postContent;
    if (!editorContent.trim() || editorContent === '<p></p>') {
      toast.info('내용을 입력해주세요', { position: 'top-center' });
      return;
    }
    if (!selectedBlog.trim()) {
      toast.info('블로그를 선택해주세요', { position: 'top-center' });
      return;
    }
    if (!category.trim()) {
      toast.info('카테고리를 선택해주세요', { position: 'top-center' });
      return;
    }
    if (!langType.trim()) {
      toast.info('언어를 선택해주세요', { position: 'top-center' });
      return;
    }
    if (!featuredImage.trim()) {
      toast.info('타이틀 이미지를 설정해주세요', { position: 'top-center' });
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && editPostId) {
        // 수정 모드
        await updatePost('draft');
        toast.success('포스트가 수정되었습니다! 📝');

        // sessionStorage에 postDetailData 저장
        sessionStorage.setItem('postDetailData', JSON.stringify({
          postId: editPostId,
        }));

        // 상세 페이지로 이동
        router.push(`/post/${postSlug}`);
      } else {
        // 새 글 모드
        const result = await createPost('draft');
        const postId = result.result?.post?.postId;
        const slug = result.result?.post?.slug;

        if (!postId || !slug) {
          throw new Error('포스트 정보를 받지 못했습니다.');
        }

        // sessionStorage에 postDetailData 저장
        sessionStorage.setItem('postDetailData', JSON.stringify({
          postId: postId,
        }));

        toast.success('초안이 저장되었습니다! 📝');

        // 상세 페이지로 이동 (slug만 URL에 포함)
        router.push(`/post/${slug}`);
      }
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      toast.error(`저장에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    // 유효성 검사
    if (!postTitle.trim()) {
      toast.info('제목을 입력해주세요', { position: 'top-center' });
      return;
    }
    const editorContent = editorRef.current?.getHTML?.() || postContent;
    if (!editorContent.trim() || editorContent === '<p></p>') {
      toast.info('내용을 입력해주세요', { position: 'top-center' });
      return;
    }
    if (!selectedBlog.trim()) {
      toast.info('블로그를 선택해주세요', { position: 'top-center' });
      return;
    }
    if (!category.trim()) {
      toast.info('카테고리를 선택해주세요', { position: 'top-center' });
      return;
    }
    if (!langType.trim()) {
      toast.info('언어를 선택해주세요', { position: 'top-center' });
      return;
    }
    if (!featuredImage.trim()) {
      toast.info('타이틀 이미지를 설정해주세요', { position: 'top-center' });
      return;
    }

    setIsPublishing(true);
    try {
      if (isEditMode && editPostId) {
        // 수정 모드
        await updatePost('published');
        toast.success('포스트가 수정 발행되었습니다! 🎉');

        // sessionStorage에 postDetailData 저장
        sessionStorage.setItem('postDetailData', JSON.stringify({
          postId: editPostId,
        }));

        // 상세 페이지로 이동
        router.push(`/post/${postSlug}`);
      } else {
        // 새 글 모드
        const result = await createPost('published');
        const postId = result.result?.post?.postId;
        const slug = result.result?.post?.slug;

        if (!postId || !slug) {
          throw new Error('포스트 정보를 받지 못했습니다.');
        }

        // sessionStorage에 postDetailData 저장
        sessionStorage.setItem('postDetailData', JSON.stringify({
          postId: postId,
        }));

        toast.success('포스트가 발행되었습니다! 🎉');

        // 상세 페이지로 이동 (slug만 URL에 포함)
        router.push(`/post/${slug}`);
      }
    } catch (error) {
      console.error('❌ 포스트 발행 실패:', error);
      toast.error(`포스트 발행에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSetFeatured = (imageUrl: string) => {
    // URL이든 base64든 그대로 저장 (API에서 처리)
    setFeaturedImage(imageUrl);
    toast.success('타이틀 이미지가 설정되었습니다.');
  };

  // 템플릿 목록 불러오기
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/getTemplates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.code === 'S' && data.result) {
        setTemplates(data.result.templates || []);
      }
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // 템플릿 모달 열기
  const handleOpenTemplateModal = async () => {
    setShowTemplateModal(true);
    await loadTemplates();
  };

  // 템플릿 적용
  const handleApplyTemplate = async (templateId: string, templateTitle: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/getTemplate?templateId=${templateId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.code === 'S' && data.result) {
        const templateContent = data.result.template.content;
        setPostContent(templateContent);

        // 에디터에 직접 설정
        if (editorRef.current?.chain) {
          const chain = editorRef.current.chain();
          if (chain && typeof chain === 'object' && 'focus' in chain) {
            (chain as any).focus().setContent(templateContent).run();
          }
        }

        toast.success(`"${templateTitle}" 템플릿을 불러왔습니다.`);
        setShowTemplateModal(false);
      } else {
        toast.error(data.message || '템플릿을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('템플릿 조회 실패:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    }
  };

  // 맞춤법 수정 적용
  const handleApplySpellFix = (original: string, suggestion: string) => {
    if (editorRef.current) {
      const currentContent = editorRef.current.getHTML?.() || postContent;
      console.log('🔧 맞춤법 수정 적용:', { original, suggestion, currentContent: currentContent.substring(0, 100) });

      // 정규식 특수문자 이스케이프
      const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const updatedContent = currentContent.replace(new RegExp(escapedOriginal, 'g'), suggestion);

      console.log('✅ 수정된 내용:', updatedContent.substring(0, 100));

      // 에디터 내용 업데이트
      setPostContent(updatedContent);

      // 에디터에 직접 설정 (chain 사용)
      if (editorRef.current.chain) {
        const chain = editorRef.current.chain();
        if (chain && typeof chain === 'object' && 'focus' in chain) {
          (chain as any).focus().setContent(updatedContent).run();
        }
      }

      toast.success(`"${original}" → "${suggestion}" 수정 완료!`, { position: 'top-center' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style dangerouslySetInnerHTML={{__html: `
        [data-sonner-toast][data-type="info"] {
          background: white !important;
          color: #3b82f6 !important;
          border: 2px solid #3b82f6 !important;
        }
        [data-sonner-toast][data-type="info"] [data-icon] {
          color: #3b82f6 !important;
        }
      `}} />
      
      {/* Header - 버튼만 */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={handleOpenTemplateModal}
            variant="secondary"
            icon={FileText}
          >
            템플릿 가져오기
          </Button>
          <Button
            onClick={() => setShowSpellCheck(!showSpellCheck)}
            variant="secondary"
            icon={FileText}
          >
            맞춤법 검사
          </Button>
          <Button
            onClick={() => {
              if (!isPreview) {
                // 미리보기로 전환하기 전에 에디터 내용 저장
                const editorContent = editorRef.current?.getHTML?.();
                if (editorContent) {
                  setPostContent(editorContent);
                }
              }
              setIsPreview(!isPreview);
            }}
            variant="secondary"
            icon={Eye}
          >
            {isPreview ? '편집' : '미리보기'}
          </Button>
          {/* 초안 저장 버튼: 새 글이거나 기존 글이 초안 상태일 때만 표시 */}
          {(!isEditMode || postStatus === 'draft') && (
            <Button
              onClick={handleSaveAsDraft}
              disabled={isSaving || isPublishing}
              variant="secondary"
              icon={Save}
              loading={isSaving}
            >
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          )}
          <Button
            onClick={handlePublish}
            disabled={isPublishing || isSaving}
            variant="primary"
            icon={Send}
            loading={isPublishing}
          >
            {isPublishing ? '발행 중...' : '발행'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 메인 에디터 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <input
                  type="text"
                  placeholder="멋진 포스트 제목을 입력하세요..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full text-xl font-semibold border-none outline-none mb-3"
                />
                <input
                  type="text"
                  placeholder="포스트 설명을 입력하세요..."
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                  className="w-full text-sm text-gray-600 border-none outline-none"
                />
              </div>

              <div className={isPreview ? 'preview-mode' : ''}>
                {!isLoading && (
                  <AdvancedNovelEditor
                    key={editPostId || 'new'} // 수정 모드일 때 postId로 key 설정하여 리마운트
                    initialContent={postContent}
                    onSave={handleSave}
                    selectedBlog={selectedBlog}
                    onBlogChange={setSelectedBlog}
                    onSetFeatured={handleSetFeatured}
                    featuredImage={featuredImage}
                    ref={editorRef}
                  />
                )}
                {isLoading && (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">로딩 중...</div>
                  </div>
                )}
              </div>
              <style jsx>{`
                :global(.ProseMirror) {
                  max-height: 60vh;
                  overflow-y: auto;
                }
                .preview-mode :global(.ProseMirror) {
                  pointer-events: none;
                  user-select: text;
                }
                .preview-mode :global(.border-b.p-2.flex.items-center),
                .preview-mode :global(div[class*="flex items-center justify-between"]),
                .preview-mode :global(.image-toolbar-panel),
                .preview-mode :global(.table-editor-panel),
                .preview-mode :global(.blockquote-toolbar-panel),
                .preview-mode :global(.divider-toolbar-portal),
                .preview-mode :global(.ai-dropdown-container),
                .preview-mode :global(div[class*="mt-4 p-4"]:has(h4)),
                .preview-mode :global(div[class*="mt-4 p-3"]:has(strong)) {
                  display: none !important;
                }
              `}</style>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            
            {/* 발행 설정 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold mb-4">발행 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    블로그 선택 <span className="text-red-500">*</span>
                  </label>
                  <CommonCodeSelect
                    groupCode="BLOG_ID"
                    value={selectedBlog}
                    onChange={setSelectedBlog}
                    placeholder="블로그를 선택하세요"
                    showAll={false}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    선택한 블로그에 포스트가 저장됩니다
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 <span className="text-red-500">*</span>
                  </label>
                  <CategorySelect
                    blogId={selectedBlog}
                    value={category}
                    onChange={setCategory}
                    placeholder="카테고리를 선택하세요"
                    showAll={false}
                    disabled={!selectedBlog}
                    initialCategoryId={initialCategoryId}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    언어 <span className="text-red-500">*</span>
                  </label>
                  <CommonCodeSelect
                    groupCode="LANG"
                    value={langType}
                    onChange={setLangType}
                    placeholder="언어를 선택하세요"
                    showAll={false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">태그</label>
                  <input
                    type="text"
                    placeholder="태그를 입력하세요 (쉼표로 구분)"
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 타이틀 이미지 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                ⭐ 타이틀 이미지 <span className="text-red-500">*</span>
              </h3>
              {featuredImage ? (
                <>
                  <div className="relative">
                    <img
                      src={featuredImage}
                      alt="Featured"
                      className="w-full h-auto rounded-lg border border-gray-200 featured-image-preview"
                      data-featured-preview="true"
                    />
                    <button
                      onClick={() => {
                        setFeaturedImage('');
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      title="타이틀 이미지 해제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    본문에서 이미지를 클릭하여 타이틀 이미지를 변경할 수 있습니다.
                  </p>
                </>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1 font-medium">
                    타이틀 이미지가 설정되지 않았습니다
                  </p>
                  <p className="text-xs text-gray-500">
                    본문에서 이미지를 클릭하여 타이틀 이미지로 설정하세요
                  </p>
                </div>
              )}
            </div>

            {/* SEO 설정 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <h3 className="font-semibold mb-2">SEO 설정</h3>
              <p className="text-sm text-gray-500 mb-4">
                검색엔진 최적화를 위한 메타데이터
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메타 제목</label>
                  <input
                    type="text"
                    placeholder="검색 결과에 표시될 제목"
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메타 설명</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                    placeholder="검색 결과에 표시될 설명 (160자 이하)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">키워드</label>
                  <input
                    type="text"
                    placeholder="검색 키워드 (쉼표로 구분)"
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-lg"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 맞춤법 검사 패널 */}
      <SpellCheckPanel
        isOpen={showSpellCheck}
        onClose={() => setShowSpellCheck(false)}
        getContent={() => editorRef.current?.getHTML?.() || postContent}
        onApplyFix={handleApplySpellFix}
      />

      {/* 템플릿 선택 모달 */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* 배경 오버레이 */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowTemplateModal(false)}
            />

            {/* 모달 컨텐츠 */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden z-10">
              {/* 모달 헤더 */}
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  템플릿 선택
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  사용할 템플릿을 선택하세요
                </p>
              </div>

              {/* 모달 바디 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">저장된 템플릿이 없습니다.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      프로필 &gt; 템플릿 설정에서 템플릿을 추가하세요.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.templateId}
                        onClick={() => handleApplyTemplate(template.templateId, template.title)}
                        className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 group-hover:text-blue-600">
                              {template.title}
                            </p>
                            {template.createdAt && (
                              <p className="text-xs text-gray-500">
                                {new Date(template.createdAt).toLocaleDateString('ko-KR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">페이지를 불러오는 중...</p>
      </div>
    </div>}>
      <WritePageContent />
    </Suspense>
  );
}