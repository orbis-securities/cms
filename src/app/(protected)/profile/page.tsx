"use client";

import { useState, useRef } from 'react';
import { User, FileText } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { AdvancedNovelEditorRef } from '@/components/editor/AdvancedNovelEditor';
import ProfileInfo from './components/ProfileInfo';
import TemplateList from './components/TemplateList';
import TemplateEditorModal from './components/TemplateEditorModal';
import { Template } from '@/types';

// AG Grid 모듈 등록
ModuleRegistry.registerModules([AllCommunityModule]);

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'templates'>('account');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const editorRef = useRef<AdvancedNovelEditorRef>(null);

  const menuItems = [
    { id: 'account', name: '계정 정보', icon: User },
    { id: 'templates', name: '템플릿 설정', icon: FileText },
  ];

  // 템플릿 모달 열기 (신규)
  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateTitle('');
    setTemplateContent('');
    setIsModalOpen(true);
  };

  // 템플릿 모달 열기 (수정)
  const handleOpenEditTemplate = (template: Template) => {
    if (!user?.id) {
      toast.error('사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setEditingTemplate(template);
    setTemplateTitle('');
    setTemplateContent('');
    setIsModalOpen(true);
  };

  // 템플릿 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setTemplateTitle('');
    setTemplateContent('');

    // 에디터 내용도 초기화
    if (editorRef.current?.clearContent) {
      editorRef.current.clearContent();
    }
  };

  // 템플릿 저장 성공 후 처리
  const handleSaveSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />
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
                      onClick={() => setActiveTab(item.id as 'account' | 'templates')}
                      className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors whitespace-nowrap ${
                        activeTab === item.id
                          ? 'bg-blue-100 text-blue-700 font-medium'
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
            {activeTab === 'account' && (
              <ProfileInfo user={user} />
            )}

            {activeTab === 'templates' && (
              <TemplateList
                onEditTemplate={handleOpenEditTemplate}
                onNewTemplate={handleOpenNewTemplate}
                refreshTrigger={refreshTrigger}
              />
            )}
        </main>
      </div>

      {/* 템플릿 에디터 모달 */}
      <TemplateEditorModal
        isOpen={isModalOpen}
        editingTemplate={editingTemplate}
        templateTitle={templateTitle}
        templateContent={templateContent}
        userId={user?.id}
        onClose={handleCloseModal}
        onSaveSuccess={handleSaveSuccess}
        onTitleChange={setTemplateTitle}
        onContentChange={setTemplateContent}
        editorRef={editorRef}
      />
    </div>
  );
}
