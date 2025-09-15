"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import AdvancedNovelEditor from '@/components/editor/AdvancedNovelEditor';
import { uploadImageToStorage, compressImage } from '@/lib/firebase/storage';
import { savePostToFirestore } from '@/lib/firebase/posts';
import { 
  PenTool, 
  Image as ImageIcon, 
  Settings, 
  Eye, 
  Save,
  Sparkles,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function Home() {
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{url: string, name: string}[]>([]);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState('');
  const [category, setCategory] = useState('시장 분석');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<{ chain: () => { focus: () => { setImage: (params: { src: string; width: number; height: number; }) => { run: () => void } } } } | null>(null);

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
    setPostContent(content);
    toast.success('포스트가 자동 저장되었습니다');
  };

  const handlePublish = async () => {
    if (!postTitle.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    if (!postContent.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }
    if (!selectedBlog.trim()) {
      toast.error('블로그 ID를 입력해주세요');
      return;
    }

    setIsPublishing(true);
    try {
      console.log('🚀 포스트 발행 시작:', postTitle);
      
      const postId = await savePostToFirestore(
        postTitle,
        postContent,
        selectedBlog,
        {
          category,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          metaTitle: metaTitle || postTitle,
          metaDescription: metaDescription,
          keywords: keywords.split(',').map(keyword => keyword.trim()).filter(Boolean),
          status: 'published'
        }
      );
      
      console.log('✅ 포스트 발행 완료:', postId);
      toast.success(`포스트가 Firestore에 저장되었습니다! 🎉\nPost ID: ${postId}`);
      
      // 성공 후 폼 초기화 (선택사항)
      // setPostTitle('');
      // setPostContent('');
      // setTags('');
      // setMetaTitle('');
      // setMetaDescription('');
      // setKeywords('');
      
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
      
      toast.success(`이미지 업로드 완료: ${file.name}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Multi-Blog CMS
              </h1>
              <p className="text-sm text-gray-500">
                워드프레스급 블로그 관리 시스템
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
              <Sparkles className="w-3 h-3" />
              AI 활성화
            </div>
            <button 
              className="px-3 py-1 border rounded text-sm"
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              {isPreview ? '편집' : '미리보기'}
            </button>
            <button 
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                  발행 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 inline mr-1" />
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
                  <span>블로그 ID: {selectedBlog || '미입력'}</span>
                  <span>•</span>
                  <span>카테고리: {category}</span>
                </div>
              </div>
              
              <div>
                {isPreview ? (
                  <div className="p-6 min-h-[600px]">
                    <h1 className="text-2xl font-bold mb-4">{postTitle || '제목 없음'}</h1>
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: postContent || '<p>내용을 입력해주세요...</p>' }}
                    />
                  </div>
                ) : (
                  <AdvancedNovelEditor
                    initialContent=""
                    onSave={handleSave}
                    blogId="demo-blog"
                    ref={editorRef}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            
            {/* 발행 설정 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-4">발행 설정</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">블로그 ID</label>
                  <input
                    type="text"
                    placeholder="블로그 ID를 입력하세요 (예: blog123123)"
                    className="w-full px-3 py-2 border rounded"
                    value={selectedBlog}
                    onChange={(e) => setSelectedBlog(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    해당 블로그 사이트에서 이 ID로 포스트를 가져옵니다
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">상태</label>
                  <select className="w-full px-3 py-2 border rounded">
                    <option>초안</option>
                    <option>발행</option>
                    <option>예약</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">카테고리</label>
                  <select 
                    className="w-full px-3 py-2 border rounded"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="시장 분석">시장 분석</option>
                    <option value="거래 전략">거래 전략</option>
                    <option value="경제 뉴스">경제 뉴스</option>
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

            {/* 미디어 */}
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                미디어
              </h3>
              
              {/* 파일 업로드 영역 */}
              <div 
                data-upload-area
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${
                  isImageUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleFileSelect}
                role="button"
                tabIndex={0}
              >
                {isImageUploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-spin" />
                    <p className="text-sm text-blue-600">이미지 업로드 중...</p>
                  </>
                ) : (
                  <>
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${
                      dragActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm mb-2 ${
                      dragActive ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {dragActive ? '이미지를 놓으세요' : '이미지를 드래그하거나 클릭하여 업로드'}
                    </p>
                    <button 
                      className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileSelect();
                      }}
                    >
                      파일 선택
                    </button>
                  </>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {/* 업로드된 이미지 목록 */}
              {uploadedImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">업로드된 이미지</h4>
                  <div className="space-y-2">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                        <img 
                          src={image.url} 
                          alt={image.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 truncate" title={image.name}>
                            {image.name}
                          </p>
                        </div>
                        <button
                          onClick={() => insertImageToEditor(image.url)}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="에디터에 삽입"
                        >
                          삽입
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="제거"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
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

      {/* 기능 소개 섹션 */}
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
            <div className="bg-gray-50 rounded-lg p-6">
              <Sparkles className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI 자동완성</h3>
              <p className="text-gray-600 text-sm">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">/</kbd> 키를 눌러 GPT-4가 자동으로 글을 이어서 작성해드립니다.
                생산성이 3배 향상됩니다.
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
    </div>
  );
}
