"use client";

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  List,
  Image
} from 'lucide-react';
import { Toaster } from 'sonner';
import CategoryManagement from './page/CategoryManagement';
import PageBannerSetting from './page/PageBannerSetting';

export default function AdminPage() {
  const [selectedMenu, setSelectedMenu] = useState<string>('category');

  const menuItems = [
    { id: 'category', name: '카테고리', icon: List },
    { id: 'banner', name: '배너 설정', icon: Image },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">메인으로</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  관리자
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  블로그 설정 및 데이터 관리
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto gap-6 p-4 sm:p-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-48 bg-white border border-gray-200 rounded-lg shadow-sm">
          <nav className="p-3 sm:p-4">
            <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id} className="flex-shrink-0 lg:flex-shrink">
                    <button
                      onClick={() => setSelectedMenu(item.id)}
                      className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors whitespace-nowrap ${
                        selectedMenu === item.id
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {selectedMenu === 'category' && <CategoryManagement />}
          {selectedMenu === 'banner' && <PageBannerSetting />}
        </main>
      </div>
    </div>
  );
}