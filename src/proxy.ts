import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 토큰 확인 (쿠키에서)
  const authToken = request.cookies.get('authToken')?.value;

  // 루트 경로는 로그인 페이지로 리다이렉트
  if (pathname === '/') {
    if (authToken) {
      return NextResponse.redirect(new URL('/post', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 로그인 페이지는 체크 제외
  if (pathname === '/login') {
    // 이미 로그인된 상태면 게시글 관리 페이지로 리다이렉트
    if (authToken) {
      return NextResponse.redirect(new URL('/post', request.url));
    }
    return NextResponse.next();
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// proxy가 실행될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
