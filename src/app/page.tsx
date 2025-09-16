"use client";

import Link from 'next/link';
import { PenTool, FileText, Settings } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <PenTool className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Multi-Blog CMS
              </h1>
            </div>
          </div>
          <p className="text-gray-600">
            워드프레스급 블로그 관리 시스템
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            무엇을 하시겠습니까?
          </h2>
          <p className="text-lg text-gray-600">
            원하는 작업을 선택해주세요
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">

          {/* 글쓰기 카드 */}
          <Link href="/write" className="group">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-blue-500 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <PenTool className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                새 글쓰기
              </h3>
              <p className="text-gray-600 mb-4">
                고급 에디터로 새로운 포스트를 작성하고 발행하세요
              </p>
              <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                글쓰기 시작하기
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* 글 관리 카드 */}
          <Link href="/manage" className="group">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-green-500 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                글 관리
              </h3>
              <p className="text-gray-600 mb-4">
                작성된 포스트를 확인하고 수정하거나 관리하세요
              </p>
              <div className="inline-flex items-center text-green-600 font-medium group-hover:text-green-700">
                관리하기
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* 관리자 카드 */}
          <Link href="/admin" className="group">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center hover:border-purple-500 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                관리자
              </h3>
              <p className="text-gray-600 mb-4">
                블로그 설정과 카테고리를 관리하고 데이터를 초기화하세요
              </p>
              <div className="inline-flex items-center text-purple-600 font-medium group-hover:text-purple-700">
                설정하기
                <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
}