"use client";

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SunEditorWrapper, { SunEditorWrapperRef } from '@/components/editor/core/SunEditorWrapper';
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
import SpellCheckPanel from '@/components/editor/modals/SpellCheckPanel';
import SEOAnalyzer from '@/components/editor/modals/SEOAnalyzer';
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
  const [currentEditorContent, setCurrentEditorContent] = useState(''); // SEO 분석용 실시간 에디터 내용
  const [isMetaManuallyEdited, setIsMetaManuallyEdited] = useState(false); // 사용자가 메타 설명을 직접 수정했는지 추적
  const editorRef = useRef<SunEditorWrapperRef>(null);

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

            // SEO 설정 - 제목과 본문에서 자동 생성
            // 메타 제목: 포스트 제목 사용
            setMetaTitle(post.title || '');

            // 메타 설명: 본문에서 추출 (110자)
            const textOnly = (post.content || '')
              .replace(/<[^>]*>/g, '') // HTML 태그 제거
              .replace(/&nbsp;/g, ' ') // &nbsp; 제거
              .trim()
              .substring(0, 110);
            setMetaDescription(textOnly);

            // 키워드: 제목에서 추출
            const titleWords = (post.title || '')
              .split(/\s+/)
              .filter((word: string) => word.length > 1)
              .slice(0, 5)
              .join(', ');
            setKeywords(titleWords);

            // 자동 생성된 메타 설명이므로 플래그 리셋
            setIsMetaManuallyEdited(false);

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

  // 에디터 내용 실시간 감지 (SEO 분석용)
  useEffect(() => {
    const interval = setInterval(() => {
      const content = editorRef.current?.getHTML?.() || '';
      setCurrentEditorContent(content);
    }, 2000); // 2초마다 체크

    return () => clearInterval(interval);
  }, []);


  // 제목 입력 완료 후 SEO 필드 자동 채우기
  const handleTitleBlur = () => {
    if (postTitle) {
      // 메타 제목: 포스트 제목 사용 (기존 값이 없거나 비어있을 때)
      if (!metaTitle || metaTitle.trim() === '') {
        setMetaTitle(postTitle);
      }

      // 키워드: 제목에서 추출 (기존 값이 없거나 비어있을 때)
      if (!keywords || keywords.trim() === '') {
        const titleWords = postTitle
          .split(/\s+/)
          .filter((word: string) => word.length > 1)
          .slice(0, 5)
          .join(', ');
        setKeywords(titleWords);
      }
    }
  };

  // 메타 설명 자동 채우기 - 에디터 내용 변경 시 (2초마다)
  useEffect(() => {
    // 사용자가 직접 수정하지 않았을 때만 자동 업데이트
    if (!isMetaManuallyEdited && currentEditorContent) {
      const textOnly = currentEditorContent
        .replace(/<[^>]*>/g, '') // HTML 태그 제거
        .replace(/&nbsp;/g, ' ') // &nbsp; 제거
        .trim()
        .substring(0, 110); // 110자로 제한

      if (textOnly && textOnly.length > 10) { // 최소 10자 이상일 때만
        setMetaDescription(textOnly);
      }
    }
  }, [currentEditorContent, isMetaManuallyEdited]);

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

  // 이미지 URL을 Base64로 변환하는 함수
  const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('이미지 변환 실패:', url, error);
      return url; // 실패 시 원본 URL 반환
    }
  };

  // HTML의 모든 이미지를 Base64로 변환
  const convertAllImagesToBase64 = async (html: string): Promise<string> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');

    if (images.length === 0) {
      return html;
    }

    // 모든 이미지를 병렬로 변환
    const conversionPromises = Array.from(images).map(async (img) => {
      const src = img.getAttribute('src');
      if (!src) return;

      // 이미 Base64인 경우 스킵
      if (src.startsWith('data:')) return;

      // Supabase URL인 경우 스킵 (이미 업로드된 이미지)
      if (src.includes('supabase.co')) return;

      // URL을 Base64로 변환
      const base64 = await convertImageToBase64(src);
      img.setAttribute('src', base64);
    });

    await Promise.all(conversionPromises);

    // 변환된 HTML 반환
    return doc.body.innerHTML;
  };

  // 게시글 생성 함수
  const createPost = async (status: 'draft' | 'published') => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    // 원본 HTML 그대로 사용
    let editorContent = editorRef.current?.getHTML?.() || postContent;

    // 모든 이미지를 Base64로 변환
    editorContent = await convertAllImagesToBase64(editorContent);

    const pollsData = extractPollsDataFromHTML(editorContent);

    const requestBody = {
      blogId: selectedBlog,
      categoryId: category,
      title: postTitle,
      description: postDescription,
      content: editorContent,
      featuredImage: featuredImage,
      langType: langType,
      tags: tags,
      status: status,
      seoTitle: metaTitle || postTitle,
      seoDescription: metaDescription,
      seoKeywords: keywords,
      ...(pollsData.length > 0 && { polls: pollsData })
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/createPost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

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

    // 원본 HTML 그대로 사용
    let editorContent = editorRef.current?.getHTML?.() || postContent;

    // 모든 이미지를 Base64로 변환
    editorContent = await convertAllImagesToBase64(editorContent);

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
      featuredImage: featuredImage,
      langType: langType,
      tags: tags,
      status: status,
      seoTitle: metaTitle || postTitle,
      seoDescription: metaDescription,
      seoKeywords: keywords,
      ...(pollsData.length > 0 && { polls: pollsData }),
      ...(isDraftToPublished && userId && { publishedBy: userId })
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/updatePost`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

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
      } else {
        // 새 글 모드
        const result = await createPost('draft');
        const postId = result.result?.post?.postId;
        const slug = result.result?.post?.slug;

        if (!postId || !slug) {
          throw new Error('포스트 정보를 받지 못했습니다.');
        }

        toast.success('초안이 저장되었습니다! 📝');

        // slug 상태 업데이트
        setPostSlug(slug);

        // 수정 모드로 전환 (URL만 변경)
        router.replace(`/write-sun?id=${postId}&blog=${selectedBlog}&category=${category}`);
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
    // 강제로 state 변경 (React가 변경을 감지하도록)
    setFeaturedImage('');
    setTimeout(() => {
      setFeaturedImage(imageUrl);
    }, 10);
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
      // 정규식 특수문자 이스케이프
      const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const updatedContent = currentContent.replace(new RegExp(escapedOriginal, 'g'), suggestion);

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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
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
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">

          {/* 메인 에디터 */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <input
                  type="text"
                  placeholder="멋진 포스트 제목을 입력하세요..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  onBlur={handleTitleBlur}
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
                  <SunEditorWrapper
                    key="editor"
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
                :global(.sun-editor) {
                  border-radius: 8px;
                }
                :global(.sun-editor-editable) {
                  max-height: 60vh;
                  overflow-y: auto;
                  font-size: 16px;
                  line-height: 1.6;
                }
                .preview-mode :global(.sun-editor) {
                  pointer-events: none;
                  user-select: text;
                }
                .preview-mode :global(.se-toolbar) {
                  display: none !important;
                }
              `}</style>
            </div>
          </div>

          {/* 사이드바 - 2x2 그리드 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 첫 번째 줄: 발행 설정 + SEO 점수 */}
            <div className="grid grid-cols-2 gap-6">
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

              {/* SEO 점수 체커 */}
              <SEOAnalyzer
                title={postTitle}
                content={currentEditorContent}
                metaDescription={metaDescription}
              />
            </div>

            {/* 두 번째 줄: 타이틀 이미지 + 메타정보 */}
            <div className="grid grid-cols-2 gap-6">
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
                        className="w-full h-auto rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => setFeaturedImage('')}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        title="타이틀 이미지 해제"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      본문 이미지를 클릭하고 금색 별 버튼을 눌러 변경할 수 있습니다.
                    </p>
                  </>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      타이틀 이미지가 설정되지 않았습니다
                    </p>
                    <p className="text-xs text-gray-500">
                      본문 이미지를 클릭하고 금색 별 버튼을 눌러주세요
                    </p>
                  </div>
                )}
              </div>

              {/* 메타정보 */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h3 className="font-semibold mb-2">메타정보</h3>
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
                      onChange={(e) => {
                        setMetaDescription(e.target.value);
                        setIsMetaManuallyEdited(true); // 사용자가 직접 수정함
                      }}
                    />
                  </div>
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