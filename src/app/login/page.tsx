"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      // 디버깅용 로그
      console.log('Login response:', {
        status: response.status,
        ok: response.ok,
        data
      });

      if (!response.ok || data.code !== "S") {
        throw new Error(data.message || '로그인에 실패했습니다.');
      }

      // 로그인 성공 시 토큰 저장
      const accessToken = data.result?.accessToken;
      const refreshToken = data.result?.refreshToken;

      if (accessToken) {
        localStorage.setItem('authToken', accessToken);
        // 쿠키에도 저장 (middleware에서 사용)
        document.cookie = `authToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7일
      }

      // refreshToken이 있으면 저장
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // 사용자 정보 저장
      if (data.result?.user) {
        localStorage.setItem('user', JSON.stringify(data.result.user));
      }

      // 공통 코드 조회 및 저장
      try {
        const commonCodeResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/getCommonCode`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        const commonCodeData = await commonCodeResponse.json();

        if (commonCodeData.code === "S" && commonCodeData.result) {
          localStorage.setItem('commonCode', JSON.stringify(commonCodeData.result.codes));
          console.log('✅ 공통 코드 저장 완료:', commonCodeData.result);
        }
      } catch (error) {
        console.error('공통 코드 조회 실패:', error);
        // 공통 코드 조회 실패해도 로그인은 진행
      }

      toast.success('로그인 성공!');

      // 쿠키가 설정된 후 강제 리다이렉트
      window.location.href = '/post';
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mx-auto mb-4">
            <Image
              src="/logo/Orbis_Logo_Black.png"
              alt="Orbis CMS"
              width={150}
              height={50}
              className="h-12 w-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}