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
      <div className="flex flex-col lg:flex-row max-w-screen-2xl mx-auto gap-6 px-5 py-6">
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