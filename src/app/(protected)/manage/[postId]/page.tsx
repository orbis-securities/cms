"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { getPostById, deletePostFromFirestore } from '@/lib/firebase/posts';
import { Post } from '@/types';
import { toast, Toaster } from 'sonner';
import { createRoot } from 'react-dom/client';
import { MarketWidgetView } from '@/components/editor/MarketWidgetView';
import { PollView } from '@/components/editor/PollView';
import React from 'react';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = params.postId as string;
  const blogId = searchParams.get('blog');
  const category = searchParams.get('category');
  const isPreview = searchParams.get('preview') === 'true'; // 미리보기 모드 확인

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!blogId || !postId) {
        toast.error('블로그 ID 또는 포스트 ID가 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const postData = await getPostById(blogId, postId);
        if (postData) {
          setPost(postData);
        } else {
          toast.error('포스트를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('포스트 로드 실패:', error);
        toast.error('포스트를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [blogId, postId]);

  // 시장 위젯을 React 컴포넌트로 렌더링
  useEffect(() => {
    if (!post || !contentRef.current) return;

    const container = contentRef.current;
    const marketWidgets = container.querySelectorAll('[data-type="market-widget"]');

    marketWidgets.forEach((widgetNode) => {
      const type = widgetNode.getAttribute('data-market-type') as 'coins' | 'exchanges';
      const symbolsStr = widgetNode.getAttribute('data-symbols');
      const symbols = symbolsStr ? JSON.parse(symbolsStr) : null;

      // React 컴포넌트를 렌더링할 컨테이너 생성
      const reactContainer = document.createElement('div');
      widgetNode.replaceWith(reactContainer);

      // React 컴포넌트 렌더링
      const root = createRoot(reactContainer);
      root.render(
        React.createElement(MarketWidgetView, {
          type: type || 'coins',
          symbols: symbols,
        })
      );
    });
  }, [post]);

  // 투표를 React 컴포넌트로 렌더링
  useEffect(() => {
    if (!post || !contentRef.current || !blogId || !postId) return;

    const container = contentRef.current;
    const pollNodes = container.querySelectorAll('[data-type="poll"]');

    pollNodes.forEach((pollNode) => {
      const pollId = pollNode.getAttribute('data-poll-id') || '';

      // HTML 속성 대신 post.polls 배열에서 데이터 사용
      const pollData = post.polls?.find(p => p.pollId === pollId);

      if (pollData) {
        // React 컴포넌트를 렌더링할 컨테이너 생성
        const reactContainer = document.createElement('div');
        pollNode.replaceWith(reactContainer);

        // React 컴포넌트 렌더링 - post.polls 데이터 사용
        const root = createRoot(reactContainer);
        root.render(
          React.createElement(PollView, {
            pollId: pollData.pollId,
            question: pollData.question,
            options: pollData.options,
            allowMultiple: pollData.allowMultiple,
            totalVotes: pollData.totalVotes,
            blogId: blogId as string,
            postId: postId as string,
          })
        );
      } else {
        // post.polls 데이터가 없는 경우 HTML에서 파싱 (하위 호환성)
        const question = pollNode.getAttribute('data-question') || '';
        const optionsStr = pollNode.getAttribute('data-options');
        const optionsRaw = optionsStr ? JSON.parse(optionsStr) : [];
        const allowMultiple = pollNode.getAttribute('data-allow-multiple') === 'true';

        // string[] 형식을 { text: string; votes: number }[] 형식으로 변환
        const options = optionsRaw.map((opt: string | { text: string; votes: number }) => {
          if (typeof opt === 'string') {
            return { text: opt, votes: 0 };
          }
          return opt;
        });

        // totalVotes 계산 (votes 합계를 사용)
        const totalVotes = options.reduce((sum: number, opt: { text: string; votes: number }) => sum + opt.votes, 0);

        // React 컴포넌트를 렌더링할 컨테이너 생성
        const reactContainer = document.createElement('div');
        pollNode.replaceWith(reactContainer);

        // React 컴포넌트 렌더링
        const root = createRoot(reactContainer);
        root.render(
          React.createElement(PollView, {
            pollId,
            question,
            options,
            allowMultiple,
            totalVotes,
            blogId: blogId as string,
            postId: postId as string,
          })
        );
      }
    });
  }, [post, blogId, postId]);

  const handleDelete = async () => {
    if (!post || !blogId) return;

    // 첫 번째 확인
    if (!confirm(`정말로 "${post.title}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    // 두 번째 확인 (ID 입력)
    const userInput = prompt(`삭제를 확인하려면 포스트 ID를 입력하세요:\n\n포스트 ID: ${post.id}`);
    if (userInput !== post.id) {
      toast.error('포스트 ID가 일치하지 않습니다. 삭제가 취소되었습니다.');
      return;
    }

    setIsDeleting(true);
    try {
      await deletePostFromFirestore(blogId, post.categories[0], post.id);
      toast.success('포스트가 삭제되었습니다.');

      // 관리 페이지로 이동
      setTimeout(() => {
        router.push('/manage');
      }, 1000);
    } catch (error) {
      console.error('포스트 삭제 실패:', error);
      toast.error('포스트 삭제에 실패했습니다.');
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">발행됨</span>;
      case 'draft':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">초안</span>;
      default:
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">포스트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">포스트를 찾을 수 없습니다.</p>
          <Link
            href="/manage"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            관리 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      {!isPreview && (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link
              href="/manage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              목록으로
            </Link>

            <div className="flex items-center gap-2">
              {blogId === 'axi' && (
                <a
                  href="https://mmtblog.vercel.app/posts/1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  AXI 페이지
                </a>
              )}
              <Link
                href={`/write?id=${post.id}&category=${post.categories[0]}&blog=${blogId}`}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                수정
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-lg border">
          {/* Post Header */}
          <div className="p-8 border-b">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900 flex-1">
                {post.title}
              </h1>
              {getStatusBadge(post.status)}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>생성: {formatDate(post.createdAt)}</span>
              </div>
              {post.publishedAt && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>발행: {formatDate(post.publishedAt)}</span>
                </div>
              )}
              {post.categories && post.categories.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  <span>{post.categories.join(', ')}</span>
                </div>
              )}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="p-8">
            <div
              ref={contentRef}
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* SEO Info */}
          {post.seo && (
            <div className="p-8 border-t bg-gray-50">
              <h3 className="text-lg font-semibold mb-4">SEO 정보</h3>
              <div className="space-y-3">
                {post.seo.metaTitle && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">메타 제목:</span>
                    <p className="text-gray-900 mt-1">{post.seo.metaTitle}</p>
                  </div>
                )}
                {post.seo.metaDescription && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">메타 설명:</span>
                    <p className="text-gray-900 mt-1">{post.seo.metaDescription}</p>
                  </div>
                )}
                {post.seo.keywords && post.seo.keywords.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">키워드:</span>
                    <p className="text-gray-900 mt-1">{post.seo.keywords.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
