"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Tag, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Post } from '@/types';
import { toast } from 'sonner';
import { createRoot } from 'react-dom/client';
import { MarketWidgetView } from '@/components/editor/MarketWidgetView';
import { PollView } from '@/components/editor/PollView';
import ChartView from '@/components/editor/ChartView';
import React from 'react';
import Button from '@/components/common/Button';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  // slug는 URL 경로로만 사용 (SEO, 가독성), 실제 조회는 postId로 수행
  const slug = params.slug as string;
  const isPreview = searchParams.get('preview') === 'true'; // 미리보기 모드 확인

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // postId로 게시글 조회 (slug가 아닌 postId 사용)
  // sessionStorage에서 초기값 바로 읽기 (리렌더링 방지)
  const [postId] = useState<string>(() => {
    const storedData = sessionStorage.getItem('postDetailData');
    return storedData ? JSON.parse(storedData).postId || '' : '';
  });

  const [currentUserId] = useState<string>(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        return userData.id || '';
      } catch (error) {
        console.error('사용자 정보 파싱 실패:', error);
        return '';
      }
    }
    return '';
  });

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) {
        console.log('⚠️ postId가 없습니다.');
        setLoading(false);
        return;
      }

      console.log('📦 postId:', postId);

      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`https://onfwfuixsubpwftdwqea.supabase.co/functions/v1/getPost?postId=${postId}&langType=ko`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        console.log('🔍 API 응답:', data);

        if (data.code === "S" && data.result) {
          setPost(data.result.post);
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
  }, [postId]);

  // 시장 위젯을 React 컴포넌트로 렌더링
  useEffect(() => {
    if (!post || !contentRef.current || !post.blogId || !postId) return;

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
    if (!post || !contentRef.current || !post.blogId || !postId) return;

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
            blogId: post.blogId,
            postId: postId,
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
            blogId: post.blogId,
            postId: postId,
          })
        );
      }
    });
  }, [post, postId]);

  // 차트를 React 컴포넌트로 렌더링
  useEffect(() => {
    if (!post || !contentRef.current) return;

    const container = contentRef.current;
    const chartNodes = container.querySelectorAll('[data-type="chart"]');

    chartNodes.forEach((chartNode) => {
      const chartType = chartNode.getAttribute('data-chart-type') as 'bar' | 'line' | 'pie' | 'area';
      const dataStr = chartNode.getAttribute('data-chart-data');
      const title = chartNode.getAttribute('data-chart-title') || '';
      const unitsStr = chartNode.getAttribute('data-units');
      const colorsStr = chartNode.getAttribute('data-colors');

      const data = dataStr ? JSON.parse(dataStr) : [];
      const units = unitsStr ? JSON.parse(unitsStr) : {};
      const colors = colorsStr ? JSON.parse(colorsStr) : {};

      // React 컴포넌트를 렌더링할 컨테이너 생성
      const reactContainer = document.createElement('div');
      chartNode.replaceWith(reactContainer);

      // React 컴포넌트 렌더링
      const root = createRoot(reactContainer);
      root.render(
        React.createElement(ChartView, {
          type: chartType || 'bar',
          data: data,
          title: title,
          units: units,
          colors: colors,
        })
      );
    });
  }, [post]);

  // 이미지 width 적용
  useEffect(() => {
    if (!post || !contentRef.current) return;

    const container = contentRef.current;
    const imageWrappers = container.querySelectorAll('.image-wrapper[data-width]');

    imageWrappers.forEach((wrapper) => {
      const width = wrapper.getAttribute('data-width');
      const img = wrapper.querySelector('img');

      if (img && width) {
        img.style.width = `${width}px`;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
      }
    });
  }, [post]);

  const handleDelete = async () => {
    if (!post || !post.blogId) return;

    // 첫 번째 확인
    if (!confirm(`정말로 "${post.title}" 포스트를 삭제하시겠습니까?`)) {
      return;
    }

    // 두 번째 확인 (ID 입력)
    const userInput = prompt(`삭제를 확인하려면 포스트 ID를 입력하세요:\n\n포스트 ID: ${post.postId}`);
    if (userInput !== post.postId) {
      toast.error('포스트 ID가 일치하지 않습니다. 삭제가 취소되었습니다.');
      return;
    }

    setIsDeleting(true);
    try {
      // TODO: 삭제 API 구현 필요
      // const token = localStorage.getItem('authToken');
      // const response = await fetch('https://onfwfuixsubpwftdwqea.supabase.co/functions/v1/deletePost', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({ postId: post.postId }),
      // });

      toast.info('삭제 기능은 아직 구현되지 않았습니다.');
      setIsDeleting(false);

      // 관리 페이지로 이동
      // setTimeout(() => {
      //   router.push('/post');
      // }, 1000);
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
            href="/post"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            관리 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 수정/삭제 권한 체크
  const canEdit = post.createdBy === 'aiSystem' || post.createdBy === currentUserId;

  return (
    <div className="max-w-screen-2xl mx-auto px-5 py-6">
      {/* Header */}
      {!isPreview && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button
            onClick={() => router.push(`/write?id=${postId}`)}
            variant="ghost"
            icon={Edit}
            disabled={!canEdit}
          >
            수정
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!canEdit || isDeleting}
            variant="danger"
            icon={Trash2}
            loading={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Post Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {post.title}
              </h1>
              {post.description && (
                <p className="text-gray-600 text-base leading-relaxed">
                  {post.description}
                </p>
              )}
            </div>
            {getStatusBadge(post.status)}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {/* 블로그 */}
            {post.blogNm && (
              <div className="flex items-center gap-1">
                <span className="font-medium">블로그:</span>
                <span>{post.blogNm}</span>
              </div>
            )}

            {/* 카테고리 */}
            {post.categoryNm && (
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                <span>{post.categoryNm}</span>
              </div>
            )}

            {/* 언어 */}
            {post.langTypeNm && (
              <div className="flex items-center gap-1">
                <span className="font-medium">언어:</span>
                <span>{post.langTypeNm}</span>
              </div>
            )}

            {/* 작성자 */}
            {post.createdNm && (
              <div className="flex items-center gap-1">
                <span className="font-medium">작성자:</span>
                <span>{post.createdNm}</span>
              </div>
            )}

            {/* 생성일 */}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>생성: {formatDate(post.createdAt)}</span>
            </div>

            {/* 발행일 */}
            {post.publishedAt && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>발행: {formatDate(post.publishedAt)}</span>
              </div>
            )}
          </div>

          {post.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="p-6">
          <div
            ref={contentRef}
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* SEO Info */}
        {post.seo && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
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
  );
}
