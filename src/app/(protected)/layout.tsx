"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('🚫 인증되지 않은 접근, 로그인 페이지로 리다이렉트');
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않음
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600">로그인 페이지로 이동 중...</div>
        </div>
      </div>
    );
  }

  // 인증된 상태 - 보호된 콘텐츠 표시
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
    </div>
  );
}