"use client";

import { createContext, useContext, useEffect, useState, useRef } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
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
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  const logout = () => {
    // 자동 갱신 타이머 중지
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // 주기적 검증 타이머 중지
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
      validationIntervalRef.current = null;
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

  // 토큰이 아직 유효한지 확인하는 헬퍼 함수
  const isTokenStillValid = (): boolean => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;

    const now = Date.now();
    const expTime = payload.exp * 1000;

    // 만료 시간이 아직 남아있으면 true
    return expTime > now;
  };

  // 토큰 갱신 함수
  const refreshToken = async (isRetry: boolean = false): Promise<boolean> => {
    try {
      const currentRefreshToken = localStorage.getItem('refreshToken');
      const currentAccessToken = localStorage.getItem('authToken');

      // refreshToken이 있으면 사용, 없으면 accessToken으로 갱신 시도
      const tokenToUse = currentRefreshToken || currentAccessToken;

      if (!tokenToUse) {
        return false;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL}/refreshtoken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: tokenToUse
        }),
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

        // 재시도 카운터 리셋
        retryCountRef.current = 0;

        // 다음 갱신 스케줄
        scheduleTokenRefresh(newAccessToken);

        return true;
      } else {
        // 실패 시 재시도 로직
        if (!isRetry && retryCountRef.current < 3) {
          retryCountRef.current += 1;
          // 1초 후 재시도
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await refreshToken(true);
        }
        return false;
      }
    } catch (error) {
      // 네트워크 에러 등의 경우 재시도
      if (!isRetry && retryCountRef.current < 3) {
        retryCountRef.current += 1;
        // 1초 후 재시도
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await refreshToken(true);
      }
      return false;
    }
  };

  // 토큰 유효성 검증 및 갱신 필요 여부 확인
  const validateAndRefreshIfNeeded = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      return;
    }

    const now = Date.now();
    const expTime = payload.exp * 1000;
    const timeUntilExpiry = expTime - now;

    // 만료 10분 전이면 갱신
    if (timeUntilExpiry < 10 * 60 * 1000) {
      const success = await refreshToken();
      if (!success) {
        // 토큰 갱신 실패했지만 아직 유효하면 로그아웃 안함
        if (!isTokenStillValid()) {
          logout();
        }
      }
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
      refreshTimerRef.current = setTimeout(async () => {
        const success = await refreshToken();
        if (!success) {
          // 토큰 갱신 실패했지만 아직 유효하면 로그아웃 안함
          if (!isTokenStillValid()) {
            logout();
          }
        }
      }, refreshTime);
    } else {
      refreshToken().then((success) => {
        if (!success) {
          // 토큰 갱신 실패했지만 아직 유효하면 로그아웃 안함
          if (!isTokenStillValid()) {
            logout();
          }
        }
      });
    }
  };

  // 주기적인 토큰 검증 시작
  const startPeriodicValidation = () => {
    // 기존 인터벌 클리어
    if (validationIntervalRef.current) {
      clearInterval(validationIntervalRef.current);
    }

    // 2분마다 토큰 유효성 검증
    validationIntervalRef.current = setInterval(() => {
      validateAndRefreshIfNeeded();
    }, 2 * 60 * 1000);
  };

  useEffect(() => {
    // localStorage에서 토큰과 사용자 정보 확인
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);

          // 토큰 갱신 스케줄링
          scheduleTokenRefresh(token);
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    checkAuth();

    // Page Visibility API: 페이지가 다시 보일 때 토큰 검증
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 페이지가 다시 보이면 즉시 토큰 검증
        validateAndRefreshIfNeeded();
      }
    };

    // storage 이벤트 리스너 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' || e.key === 'user') {
        checkAuth();
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // 컴포넌트 언마운트 시 타이머 정리
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
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