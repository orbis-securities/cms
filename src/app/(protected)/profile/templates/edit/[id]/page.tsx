"use client";

import Link from 'next/link';
import { ArrowLeft, FileText, Construction } from 'lucide-react';

export default function EditTemplatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/profile"
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>프로필로</span>
            </Link>
            <div className="h-6 w-px bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  템플릿 수정
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  템플릿 편집하기
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            준비 중입니다
          </h2>
          <p className="text-gray-600 mb-6">
            템플릿 기능은 현재 API 마이그레이션 작업 중입니다.
            <br />
            곧 새로운 기능으로 찾아뵙겠습니다.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            Firebase → Supabase 마이그레이션 진행 중
          </div>
        </div>
      </div>
    </div>
  );
}
