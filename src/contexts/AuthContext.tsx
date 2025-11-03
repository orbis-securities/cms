"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  logout: () => {},
  refreshToken: async () => false
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// JWT 디코딩 함수 (만료 시간 확인용)
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = () => {
    // 자동 갱신 타이머 중지
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // localStorage 정리
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // 쿠키 삭제
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // 상태 업데이트
    setUser(null);

    // 로그인 페이지로 이동
    window.location.href = '/login';
  };

  // 토큰 갱신 함수
  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentRefreshToken = localStorage.getItem('refreshToken');
      const currentAccessToken = localStorage.getItem('authToken');

      // refreshToken이 있으면 사용, 없으면 accessToken으로 갱신 시도
      const tokenToUse = currentRefreshToken || currentAccessToken;

      if (!tokenToUse) {
        console.log('🚫 갱신할 토큰이 없습니다.');
        return false;
      }

      console.log('🔄 토큰 갱신 시도...');

      const response = await fetch('https://onfwfuixsubpwftdwqea.supabase.co/functions/v1/refreshToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenToUse}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.code === 'S' && data.result?.accessToken) {
        const newAccessToken = data.result.accessToken;
        const newRefreshToken = data.result.refreshToken;

        // 새 토큰 저장
        localStorage.setItem('authToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // 쿠키 업데이트
        document.cookie = `authToken=${newAccessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;

        console.log('✅ 토큰 갱신 성공');

        // 다음 갱신 스케줄
        scheduleTokenRefresh(newAccessToken);

        return true;
      } else {
        console.error('❌ 토큰 갱신 실패:', data.message);
        return false;
      }
    } catch (error) {
      console.error('❌ 토큰 갱신 에러:', error);
      return false;
    }
  };

  // 토큰 갱신 스케줄링 (만료 5분 전에 갱신)
  const scheduleTokenRefresh = (token: string) => {
    // 기존 타이머 클리어
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      return;
    }

    const now = Date.now();
    const expTime = payload.exp * 1000; // 초를 밀리초로 변환
    const timeUntilExpiry = expTime - now;
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // 만료 5분 전

    if (refreshTime > 0) {
      console.log(`⏰ 토큰 갱신 예정: ${Math.floor(refreshTime / 1000 / 60)}분 후`);
      refreshTimerRef.current = setTimeout(async () => {
        const success = await refreshToken();
        if (!success) {
          // 갱신 실패 시 로그아웃
          console.log('토큰 갱신 실패로 로그아웃합니다.');
          logout();
        }
      }, refreshTime);
    } else {
      // 이미 만료되었거나 곧 만료될 예정
      console.log('⚠️ 토큰이 곧 만료됩니다. 즉시 갱신 시도...');
      refreshToken().then((success) => {
        if (!success) {
          logout();
        }
      });
    }
  };

  useEffect(() => {
    // localStorage에서 토큰과 사용자 정보 확인
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('🔐 인증된 사용자:', userData.email);
          setUser(userData);

          // 토큰 갱신 스케줄링
          scheduleTokenRefresh(token);
        } catch (error) {
          console.error('사용자 정보 파싱 실패:', error);
          setUser(null);
        }
      } else {
        console.log('🚫 인증 정보 없음');
        setUser(null);
      }

      setLoading(false);
    };

    checkAuth();

    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // 컴포넌트 언마운트 시 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}