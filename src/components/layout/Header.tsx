"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  PenTool,
  FolderOpen,
  User,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/post', label: '관리', icon: FolderOpen },
    { href: '/write', label: '글쓰기', icon: PenTool },
    { href: '/admin', label: '관리자', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-2xl mx-auto px-5">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/post" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              CMS
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 사용자 정보 & 로그아웃 */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/profile" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <span className="font-medium text-gray-900 hover:text-blue-600">{user?.email}</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 모바일 사용자 정보 */}
          <div className="px-4 py-4 border-t border-gray-200 space-y-3">
            <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-gray-600">
              <span className="font-medium text-gray-900">{user?.email}</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
