"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AdvancedNovelEditor, { AdvancedNovelEditorRef } from '@/components/editor/AdvancedNovelEditor';
import { uploadImageToStorage, compressImage } from '@/lib/firebase/storage';
import { savePostToFirestore, getBlogSettings, getPostById, updatePostInFirestore, changePostCategory, getAllBlogs } from '@/lib/firebase/posts';
import { getTemplateById, getTemplatesByBlog, Template } from '@/lib/firebase/templates';
import { Timestamp } from 'firebase/firestore';
import {
  PenTool,
  Image as ImageIcon,
  Settings,
  Eye,
  Save,
  Send,
  Sparkles,
  Upload,
  X,
  Loader2,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import SpellCheckPanel from '@/components/editor/SpellCheckPanel';
import { inlineStyles } from '@/lib/utils/htmlStyleInliner';

function WritePageContent() {
  const searchParams = useSearchParams();
  const editPostId = searchParams.get('id');
  const editCategory = searchParams.get('category');
  const editBlogId = searchParams.get('blog');
  const templateId = searchParams.get('template');
  const isEditMode = !!(editPostId && editCategory && editBlogId);

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{url: string, name: string}[]>([]);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(editBlogId || '');
  const [category, setCategory] = useState(editCategory || '');
  const [originalCategory, setOriginalCategory] = useState(editCategory || '');
  const [tags, setTags] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableBlogs, setAvailableBlogs] = useState<{ blogId: string, displayName: string }[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPostId, setCurrentPostId] = useState(editPostId || '');
  const [showPublishedPreview, setShowPublishedPreview] = useState(false);
  const [publishedPostUrl, setPublishedPostUrl] = useState('');
  const [showSpellCheck, setShowSpellCheck] = useState(false);
  const [featuredImage, setFeaturedImage] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<AdvancedNovelEditorRef>(null);
  const templateLoadedRef = useRef(false);

  // 블로그 목록 로드
  useEffect(() => {
    console.log('🔄 블로그 목록 로드 시작');
    const loadBlogs = async () => {
      try {
        console.log('📡 getAllBlogs 호출 중...');
        const blogs = await getAllBlogs();
        console.log('📊 불러온 블로그들:', blogs);
        setAvailableBlogs(blogs);
      } catch (error) {
        console.error('블로그 목록 로드 실패:', error);
      }
    };

    loadBlogs();
  }, []);

  // 수정 모드일 때 포스트 데이터 로드
  useEffect(() => {
    const loadPostForEdit = async () => {
      console.log('🔄 수정 모드 확인:', { isEditMode, editBlogId, editCategory, editPostId });

      if (isEditMode && editBlogId && editCategory && editPostId) {
        console.log('🚀 포스트 로드 시작');
        setIsLoading(true);
        try {
          const post = await getPostById(editBlogId, editPostId);
          if (post) {
            console.log('📝 포스트 데이터 설정 중...');
            setPostTitle(post.title);
            setPostContent(post.content);
            setTags(post.tags?.join(', ') || '');
            setMetaTitle(post.seo?.metaTitle || '');
            setMetaDescription(post.seo?.metaDescription || '');
            setKeywords(post.seo?.keywords?.join(', ') || '');
            setFeaturedImage(post.featuredImage || '');
            console.log('✅ 수정할 포스트 로드 완료:', post.title);
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
  }, [isEditMode, editBlogId, editCategory, editPostId]);

  // 템플릿 로드
  useEffect(() => {
    const loadTemplate = async () => {
      if (templateId && !isEditMode && !templateLoadedRef.current) {
        console.log('🔄 템플릿 로드 시작:', templateId);
        templateLoadedRef.current = true;
        setIsLoading(true);
        try {
          const template = await getTemplateById('axi', templateId);
          if (template) {
            setPostContent(template.content);
            toast.success(`"${template.title}" 템플릿이 적용되었습니다.`, { position: 'top-center'});
          } else {
            console.warn('⚠️ 템플릿을 찾을 수 없음');
            toast.error('템플릿을 찾을 수 없습니다.');
          }
        } catch (error) {
          console.error('❌ 템플릿 로드 실패:', error);
          toast.error('템플릿을 불러오는데 실패했습니다.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTemplate();
  }, [templateId, isEditMode]);

  // 블로그 선택 시 카테고리 불러오기
  useEffect(() => {
    const loadBlogSettings = async () => {
      if (selectedBlog) {
        try {
          const settings = await getBlogSettings(selectedBlog);
          if (settings) {
            setAvailableCategories(settings.categories);
            // 수정 모드가 아닐 때만 첫 번째 카테고리를 기본값으로 설정
            if (settings.categories.length > 0 && !category && !isEditMode) {
              setCategory(settings.categories[0]);
            }
          }
        } catch (error) {
          console.error('블로그 설정 로드 실패:', error);
        }
      } else {
        // 블로그 선택 해제 시 초기화
        setAvailableCategories([]);
        if (!isEditMode) {
          setCategory('');
        }
      }
    };

    loadBlogSettings();
  }, [selectedBlog, isEditMode, category]);

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

    console.log("pollElements 개수:", pollElements.length);

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

    console.log("추출된 polls:", polls);
    return polls;
  };

  const handleSaveAsDraft = async () => {
    if (!postTitle.trim()) {
      toast.info('제목을 입력해주세요', { position: 'top-center' });
      return;
    }

    // 에디터에서 최신 내용 가져오기
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
    if (!featuredImage.trim()) {
      toast.info('타이틀 이미지를 설정해주세요', { position: 'top-center' });
      return;
    }

    setIsSaving(true);
    try {
      if (currentPostId) {
        // 수정 모드: 업데이트
        console.log('💾 포스트 수정 저장 시작:', postTitle);

        // 스타일 인라인화 (클래스 기반 스타일을 인라인으로 변환)
        const inlinedContent = inlineStyles(editorContent);

        // poll 데이터 추출 (여러 개)
        const pollsData = extractPollsDataFromHTML(inlinedContent);

        await updatePostInFirestore(selectedBlog, currentPostId, {
          title: postTitle,
          content: inlinedContent || '<p>내용을 작성해주세요...</p>',
          categories: [category],
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          status: 'draft',
          featuredImage: featuredImage,
          seo: {
            metaTitle: metaTitle || postTitle,
            metaDescription: metaDescription,
            keywords: keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
          },
          ...(pollsData.length > 0 && { polls: pollsData })
        });

        toast.success('포스트가 수정되었습니다! 📝');
      } else {
        // 새 글 모드: 생성
        console.log('💾 포스트 초안 저장 시작:', postTitle);

        // 스타일 인라인화 (클래스 기반 스타일을 인라인으로 변환)
        const inlinedContent = inlineStyles(editorContent);

        // poll 데이터 추출 (여러 개)
        const pollsData = extractPollsDataFromHTML(inlinedContent);

        const postId = await savePostToFirestore(
          postTitle,
          inlinedContent || '<p>내용을 작성해주세요...</p>',
          selectedBlog,
          {
            category,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            metaTitle: metaTitle || postTitle,
            metaDescription: metaDescription,
            keywords: keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
            status: 'draft',
            featuredImage: featuredImage
          },
          pollsData
        );

        console.log('✅ 초안 저장 완료:', postId);
        setCurrentPostId(postId); // 저장 후 수정 모드로 전환
        setOriginalCategory(category);
        toast.success(`초안이 저장되었습니다! 📝\nPost ID: ${postId}`);
      }
    } catch (error) {
      console.error('❌ 저장 실패:', error);
      toast.error(`저장에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!postTitle.trim()) {
      toast.info('제목을 입력해주세요', { position: 'top-center' });
      return;
    }

    // 에디터에서 최신 내용 가져오기
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
    if (!featuredImage.trim()) {
      toast.info('타이틀 이미지를 설정해주세요', { position: 'top-center' });
      return;
    }

    // 스타일 인라인화 (클래스 기반 스타일을 인라인으로 변환)
    const inlinedContent = inlineStyles(editorContent);

    setIsPublishing(true);
    try {
      if (currentPostId) {
        // 수정 모드: 업데이트
        console.log('🚀 포스트 수정 발행 시작:', postTitle);

        // poll 데이터 추출 (여러 개)
        const pollsData = extractPollsDataFromHTML(inlinedContent);

        await updatePostInFirestore(selectedBlog, currentPostId, {
          title: postTitle,
          content: inlinedContent,
          categories: [category],
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          status: 'published',
          publishedAt: Timestamp.now(),
          featuredImage: featuredImage,
          seo: {
            metaTitle: metaTitle || postTitle,
            metaDescription: metaDescription,
            keywords: keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
          },
          ...(pollsData.length > 0 && { polls: pollsData })
        });

        // axi 블로그일 때만 미리보기 표시
        if (selectedBlog === 'axi') {
          const previewUrl = 'https://mmtblog.vercel.app/posts/1';
          setPublishedPostUrl(previewUrl);
          setShowPublishedPreview(true);
        }

        toast.success('포스트가 수정 발행되었습니다! 🎉');
      } else {
        // 새 글 모드: 생성
        console.log('🚀 포스트 발행 시작:', postTitle);

        // poll 데이터 추출 (여러 개)
        const pollsData = extractPollsDataFromHTML(inlinedContent);

        const postId = await savePostToFirestore(
          postTitle,
          inlinedContent,
          selectedBlog,
          {
            category,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            metaTitle: metaTitle || postTitle,
            metaDescription: metaDescription,
            keywords: keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
            status: 'published',
            featuredImage: featuredImage
          },
          pollsData
        );

        console.log('✅ 포스트 발행 완료:', postId);
        setCurrentPostId(postId); // 저장 후 수정 모드로 전환
        setOriginalCategory(category);

        // axi 블로그일 때만 미리보기 표시
        if (selectedBlog === 'axi') {
          const previewUrl = 'https://mmtblog.vercel.app/posts/1';
          setPublishedPostUrl(previewUrl);
          setShowPublishedPreview(true);
        }

        toast.success(`포스트가 발행되었습니다! 🎉\nPost ID: ${postId}`);
      }
    } catch (error) {
      console.error('❌ 포스트 발행 실패:', error);
      toast.error(`포스트 발행에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setIsImageUploading(true);
    try {
      console.log('📁 사이드바 이미지 업로드 시작:', file.name, file.type, file.size);

      // 이미지 파일 유효성 검사
      if (!file.type.startsWith('image/')) {
        throw new Error('이미지 파일만 업로드 가능합니다.');
      }

      const compressedFile = await compressImage(file, 1200, 0.8);
      console.log('🗜️ 이미지 압축 완료:', compressedFile.size);

      const url = await uploadImageToStorage(compressedFile, 'demo-blog');
      console.log('✅ Firebase 업로드 완료:', url);

      // 업로드된 이미지를 목록에 추가
      setUploadedImages(prev => [...prev, { url, name: file.name }]);
      return url;
    } catch (error) {
      console.error('❌ 사이드바 이미지 업로드 에러:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`이미지 업로드 실패: ${errorMessage}`);
      throw error;
    } finally {
      setIsImageUploading(false);
    }
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleImageUpload(files[0]);
    }
    // input 값 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🎯 드래그 진입');
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // currentTarget을 벗어날 때만 비활성화
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      console.log('🚪 드래그 종료');
      setDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔄 드래그 오버');
    // 드롭을 허용하기 위해 필수
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📥 드롭 이벤트 발생');
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const items = Array.from(e.dataTransfer.items);

    console.log('📁 드롭된 파일들:', files.map(f => f.name));
    console.log('🔗 드롭된 아이템들:', items.map(i => i.type));

    // 파일이 있는 경우 (실제 파일 드롭)
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        console.log('✅ 이미지 파일 확인, 업로드 시작');
        await handleImageUpload(file);
      } else {
        console.log('❌ 이미지 파일이 아님:', file.type);
        toast.error('이미지 파일만 업로드 가능합니다.');
      }
      return;
    }
    
    // URL이나 텍스트가 드롭된 경우 (브라우저에서 이미지 드래그)
    for (const item of items) {
      if (item.type === 'text/plain' || item.type === 'text/uri-list') {
        const text = e.dataTransfer.getData(item.type);
        console.log('🔗 드롭된 텍스트/URL:', text);
        
        if (text.startsWith('file://')) {
          toast.error('로컬 파일 경로는 지원되지 않습니다. 파일을 직접 드래그하거나 파일 선택을 이용해주세요.');
          return;
        }
        
        if (text.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          console.log('🖼️ 이미지 URL 감지, 삽입 시도');
          // 외부 이미지 URL을 에디터에 직접 삽입
          if (editorRef.current) {
            (editorRef.current as any).chain().focus().setImage({ 
              src: text, 
              width: 400, 
              height: 300, 
              align: 'center' 
            }).run();
            toast.success('이미지가 삽입되었습니다.');
            return;
          }
        }
      }
    }
    
    toast.error('지원되지 않는 파일 형식입니다. 이미지 파일을 직접 드래그하거나 파일 선택을 이용해주세요.');
  };

  const insertImageToEditor = (imageUrl: string) => {
    if (editorRef.current) {
      (editorRef.current as any).chain().focus().setImage({ src: imageUrl, width: 400, height: 300 }).run();
      toast.success('이미지가 에디터에 삽입되었습니다.');
    } else {
      toast.error('에디터가 준비되지 않았습니다.');
    }
  };

  const removeImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    toast.success('이미지가 제거되었습니다.');
  };

  const handleSetFeatured = (imageUrl: string) => {
    setFeaturedImage(imageUrl);
    toast.success('타이틀 이미지가 설정되었습니다.');
  };

  // 템플릿 모달 열기 시 템플릿 목록 로드
  const handleOpenTemplateModal = async () => {
    setShowTemplateModal(true);
    setIsLoadingTemplates(true);
    try {
      const templates = await getTemplatesByBlog('axi');
      setAvailableTemplates(templates);
    } catch (error) {
      console.error('템플릿 로드 실패:', error);
      toast.error('템플릿을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // 템플릿 적용
  const handleApplyTemplate = async (template: Template) => {
    const hasContent = postContent && postContent !== '<p></p>';

    if (hasContent) {
      const confirmed = window.confirm(
        `"${template.title}" 템플릿을 적용하시겠습니까?\n\n현재 작성 중인 본문 내용이 삭제되고 템플릿 내용으로 덮어쓰기됩니다.`
      );

      if (!confirmed) {
        return;
      }
    }

    // 템플릿 적용 (제목은 유지, 본문만 교체)
    setPostContent(template.content);
    setShowTemplateModal(false);
    toast.success(`"${template.title}" 템플릿이 적용되었습니다.`, { position: 'top-center'});
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

      toast.success(`"${original}" → "${suggestion}" 수정 완료!`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
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
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              메인으로
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {currentPostId ? '포스트 수정' : '새 글쓰기'}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentPostId ? `포스트 ID: ${currentPostId}` : '새로운 포스트를 작성하세요'}
                </p>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                로딩 중...
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* AI 활성화 표시 - 주석 처리 */}
            {/*
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              <Sparkles className="w-3 h-3" />
              AI 활성화
            </div>
            */}
            <button
              className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
              onClick={handleOpenTemplateModal}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              템플릿 가져오기
            </button>
            <button
              className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
              onClick={() => setShowSpellCheck(!showSpellCheck)}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              맞춤법 검사
            </button>
            <button
              className="px-3 py-1 border rounded text-sm"
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
            >
              <Eye className="w-4 h-4 inline mr-1" />
              {isPreview ? '편집' : '미리보기'}
            </button>
            <button
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              onClick={handleSaveAsDraft}
              disabled={isSaving || isPublishing}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-1" />
                  저장
                </>
              )}
            </button>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
              onClick={handlePublish}
              disabled={isPublishing || isSaving}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                  발행 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 inline mr-1" />
                  발행
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* 메인 에디터 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border">
              <div className="p-6 border-b">
                <input
                  type="text"
                  placeholder="멋진 포스트 제목을 입력하세요..."
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full text-xl font-semibold border-none outline-none"
                />
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                  <span>
                    블로그: {
                      selectedBlog === 'axi' ? 'AXI (투자 전문)' :
                      selectedBlog === 'orbisLanding' ? 'Orbis Landing (메인)' :
                      '선택되지 않음'
                    }
                  </span>
                  <span>•</span>
                  <span>카테고리: {category}</span>
                </div>
              </div>

              <div className={isPreview ? 'preview-mode' : ''}>
                <AdvancedNovelEditor
                  initialContent={postContent}
                  onSave={handleSave}
                  blogId="demo-blog"
                  selectedBlog={selectedBlog}
                  availableBlogs={availableBlogs}
                  onBlogChange={setSelectedBlog}
                  getDesignSettings={getBlogSettings}
                  onSetFeatured={handleSetFeatured}
                  featuredImage={featuredImage}
                  ref={editorRef}
                />
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
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-4">발행 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">블로그 선택</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={selectedBlog}
                    onChange={(e) => setSelectedBlog(e.target.value)}
                    disabled={availableBlogs.length === 0}
                  >
                    {availableBlogs.length === 0 ? (
                      <option value="">블로그 로딩 중...</option>
                    ) : (
                      <>
                        <option value="">블로그를 선택하세요</option>
                        {availableBlogs.map((blog) => (
                          <option key={blog.blogId} value={blog.blogId}>
                            {blog.displayName}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    선택한 블로그에 포스트가 저장됩니다
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">카테고리</label>
                  <select
                    className="w-full px-3 py-2 border rounded"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={!selectedBlog || availableCategories.length === 0}
                  >
                    {!selectedBlog ? (
                      <option value="">먼저 블로그를 선택하세요</option>
                    ) : availableCategories.length === 0 ? (
                      <option value="">카테고리 로딩 중...</option>
                    ) : (
                      <>
                        <option value="">카테고리를 선택하세요</option>
                        {availableCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">태그</label>
                  <input
                    type="text"
                    placeholder="태그를 입력하세요 (쉼표로 구분)"
                    className="w-full px-3 py-2 border rounded"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 타이틀 이미지 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                ⭐ 타이틀 이미지
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
                      onClick={() => {
                        setFeaturedImage('');
                        toast.success('타이틀 이미지가 해제되었습니다.');
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
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-2">SEO 설정</h3>
              <p className="text-sm text-gray-500 mb-4">
                검색엔진 최적화를 위한 메타데이터
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">메타 제목</label>
                  <input 
                    type="text"
                    placeholder="검색 결과에 표시될 제목" 
                    className="w-full px-3 py-2 border rounded"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">메타 설명</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded resize-none"
                    rows={3}
                    placeholder="검색 결과에 표시될 설명 (160자 이하)"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">키워드</label>
                  <input 
                    type="text"
                    placeholder="검색 키워드 (쉼표로 구분)" 
                    className="w-full px-3 py-2 border rounded"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 템플릿 선택 모달 */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">템플릿 선택</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : availableTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    템플릿이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    프로필 페이지에서 템플릿을 먼저 생성해주세요
                  </p>
                  <Link
                    href="/profile?tab=templates"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setShowTemplateModal(false)}
                  >
                    템플릿 관리로 이동
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template)}
                      className="w-full text-left p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {template.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {template.createdAt?.toDate?.().toLocaleDateString('ko-KR') || ''}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 발행된 포스트 미리보기 모달 */}
      {showPublishedPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">발행 포스트 확인</h3>
              <div className="flex items-center gap-2">
                <a
                  href={publishedPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  axi 페이지
                </a>
                <Link
                  href={`/manage/${currentPostId}?blog=${selectedBlog}&category=${category}`}
                  className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 border border-green-600 rounded-lg hover:bg-green-50 transition-colors"
                >
                  관리자 페이지
                </Link>
                <button
                  onClick={() => {
                    setShowPublishedPreview(false);
                    // 에디터 내용 새로고침
                    setPostTitle('');
                    setPostContent('');
                    setTags('');
                    setMetaTitle('');
                    setMetaDescription('');
                    setKeywords('');
                    setFeaturedImage('');
                    setCurrentPostId('');
                    // 에디터 강제 리렌더링을 위한 방법
                    if (editorRef.current) {
                      editorRef.current.clearContent?.();
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={publishedPostUrl}
                className="w-full h-full border-0"
                title="발행 포스트 확인"
              />
            </div>
          </div>
        </div>
      )}

      {/* 기능 소개 섹션 - AI 관련 내용 수정 */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              워드프레스를 뛰어넘는 기능들
            </h2>
            <p className="text-gray-600">
              Novel Editor로 구현된 차세대 블로그 CMS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI 자동완성 섹션 주석 처리 및 다른 기능으로 대체 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <PenTool className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">고급 에디터</h3>
              <p className="text-gray-600 text-sm">
                TipTap 기반의 강력한 WYSIWYG 에디터로 자유롭게 콘텐츠를 
                작성하고 편집할 수 있습니다.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <ImageIcon className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">자유로운 미디어</h3>
              <p className="text-gray-600 text-sm">
                드래그 앤 드롭으로 이미지를 추가하고, 마우스로 크기를 자유롭게 
                조절할 수 있습니다.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <Settings className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">완벽한 SEO</h3>
              <p className="text-gray-600 text-sm">
                메타태그, Open Graph, 구조화된 데이터까지 자동 생성되어
                검색 노출이 극대화됩니다.
              </p>
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