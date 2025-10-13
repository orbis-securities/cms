"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, FileText, Settings, Edit, Trash2, Loader2, ArrowRight } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { toast, Toaster } from 'sonner';
import { Suspense } from 'react';
import { getTemplatesByBlog, deleteTemplateFromFirestore, Template } from '@/lib/firebase/templates';

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'account' | 'templates' | null;
  const [activeTab, setActiveTab] = useState<'account' | 'templates'>(tabParam || 'account');
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        email: currentUser.email,
        displayName: currentUser.displayName || '사용자',
        uid: currentUser.uid,
        photoURL: currentUser.photoURL,
      });
    }
  }, []);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // 템플릿 목록 로드
  useEffect(() => {
    const loadTemplates = async () => {
      if (activeTab === 'templates') {
        setIsLoadingTemplates(true);
        try {
          const templateList = await getTemplatesByBlog('axi');
          setTemplates(templateList);
        } catch (error) {
          console.error('템플릿 로드 실패:', error);
          toast.error('템플릿을 불러오는데 실패했습니다.');
        } finally {
          setIsLoadingTemplates(false);
        }
      }
    };

    loadTemplates();
  }, [activeTab]);

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    if (!confirm(`"${templateTitle}" 템플릿을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteTemplateFromFirestore('axi', templateId);
      toast.success('템플릿이 삭제되었습니다.');

      // 목록에서 제거
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('템플릿 삭제 실패:', error);
      toast.error('템플릿 삭제에 실패했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              메인 페이지로
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  내 정보
                </h1>
                <p className="text-sm text-gray-500">
                  계정 정보 및 설정 관리
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* 왼쪽 메뉴 */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'account'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <User className="w-5 h-5" />
                  계정 정보
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'templates'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  템플릿 설정
                </button>
              </nav>
            </div>
          </div>

          {/* 오른쪽 컨텐츠 */}
          <div className="flex-1">
            {activeTab === 'account' && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold mb-6">계정 정보</h2>

                <div className="space-y-6">
                  {/* 프로필 사진 */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user?.displayName || '사용자'}
                      </h3>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>

                  {/* 계정 상세 정보 */}
                  <div className="border-t pt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        표시 이름
                      </label>
                      <input
                        type="text"
                        value={user?.displayName || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>

                  {/* 정보 안내 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 계정 정보는 Firebase Authentication에서 관리됩니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">템플릿 설정</h2>
                  <Link
                    href="/profile/templates/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + 새 템플릿
                  </Link>
                </div>

                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      아직 템플릿이 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      새 템플릿을 추가하여 글 작성 시 빠르게 시작하세요
                    </p>
                    <Link
                      href="/profile/templates/new"
                      className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      첫 템플릿 만들기
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            템플릿 제목
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            생성일자
                          </th>
                          <th>
                            
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {templates.map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <Link
                                href={`/profile/templates/edit/${template.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {template.title}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(template.createdAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <Link
                                  href={`/write?template=${template.id}`}
                                  className="text-green-600 hover:text-green-800"
                                  title="이 템플릿으로 글쓰기"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteTemplate(template.id, template.title)}
                                  className="text-red-600 hover:text-red-800"
                                  title="삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">페이지를 불러오는 중...</p>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
