"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { getBlogSettings, saveBlogSettings, getAllBlogs } from '@/lib/firebase/posts';
import { toast, Toaster } from 'sonner';

interface BlogConfig {
  blogId: string;
  categories: string[];
}

export default function AdminPage() {
  const [blogs, setBlogs] = useState<BlogConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | null>(null);
  const [newBlogId, setNewBlogId] = useState('');
  const [showNewBlogForm, setShowNewBlogForm] = useState(false);

  // 초기 블로그 목록 로드
  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      // Firebase에서 실제 존재하는 블로그들 찾기
      const existingBlogs = await getAllBlogs();
      const blogConfigs: BlogConfig[] = [];

      console.log('🔍 감지된 블로그들:', existingBlogs);

      for (const blog of existingBlogs) {
        try {
          const settings = await getBlogSettings(blog.blogId);
          if (settings) {
            blogConfigs.push({
              blogId: blog.blogId,
              categories: settings.categories
            });
          }
        } catch (error) {
          console.warn(`블로그 ${blog.blogId} 로드 실패:`, error);
        }
      }

      setBlogs(blogConfigs);
      console.log('📊 로드된 블로그 설정:', blogConfigs);
    } catch (error) {
      console.error('블로그 목록 로드 실패:', error);
      toast.error('블로그 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새 블로그 생성
  const handleCreateBlog = async () => {
    if (!newBlogId.trim()) {
      toast.error('블로그 ID를 입력해주세요.');
      return;
    }

    try {
      const newBlog: BlogConfig = {
        blogId: newBlogId,
        categories: ['일반']
      };

      await saveBlogSettings(newBlogId, {
        categories: newBlog.categories
      });

      setBlogs([...blogs, newBlog]);
      setNewBlogId('');
      setShowNewBlogForm(false);
      toast.success(`블로그 "${newBlogId}"가 생성되었습니다!`);
    } catch (error) {
      console.error('블로그 생성 실패:', error);
      toast.error('블로그 생성에 실패했습니다.');
    }
  };

  // 블로그 설정 저장
  const handleSaveBlog = async (blog: BlogConfig) => {
    try {
      await saveBlogSettings(blog.blogId, {
        categories: blog.categories
      });

      toast.success(`블로그 "${blog.blogId}" 설정이 저장되었습니다!`);
      setEditingBlog(null);
    } catch (error) {
      console.error('블로그 설정 저장 실패:', error);
      toast.error('설정 저장에 실패했습니다.');
    }
  };

  // 카테고리 추가
  const addCategory = (blogIndex: number) => {
    const newCategory = prompt('새 카테고리 이름을 입력하세요:');
    if (newCategory && newCategory.trim()) {
      const updatedBlogs = [...blogs];
      updatedBlogs[blogIndex].categories.push(newCategory.trim());
      setBlogs(updatedBlogs);
    }
  };

  // 카테고리 제거
  const removeCategory = (blogIndex: number, categoryIndex: number) => {
    if (confirm('이 카테고리를 삭제하시겠습니까?')) {
      const updatedBlogs = [...blogs];
      updatedBlogs[blogIndex].categories.splice(categoryIndex, 1);
      setBlogs(updatedBlogs);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              메인으로
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Firebase 관리자
                </h1>
                <p className="text-sm text-gray-500">
                  블로그 설정 및 데이터 관리
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewBlogForm(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 블로그
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">

        {/* 새 블로그 생성 폼 */}
        {showNewBlogForm && (
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">새 블로그 생성</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">블로그 ID</label>
              <input
                type="text"
                placeholder="예: myBlog"
                className="w-full px-3 py-2 border rounded-lg"
                value={newBlogId}
                onChange={(e) => setNewBlogId(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateBlog}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                생성
              </button>
              <button
                onClick={() => setShowNewBlogForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 블로그 목록 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-600">블로그 목록을 불러오는 중...</p>
            </div>
          ) : (
            blogs.map((blog, blogIndex) => (
              <div key={blog.blogId} className="bg-white rounded-lg border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {blog.blogId}
                      </h3>
                      <p className="text-sm text-gray-500">{blog.categories.length}개 카테고리</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingBlog === blog.blogId ? (
                        <>
                          <button
                            onClick={() => handleSaveBlog(blog)}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                          >
                            <Save className="w-4 h-4" />
                            저장
                          </button>
                          <button
                            onClick={() => setEditingBlog(null)}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingBlog(blog.blogId)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          수정
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* 카테고리 관리 */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">카테고리</h4>
                      {editingBlog === blog.blogId && (
                        <button
                          onClick={() => addCategory(blogIndex)}
                          className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          추가
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {blog.categories.map((category, categoryIndex) => (
                        <div
                          key={categoryIndex}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          <span>{category}</span>
                          {editingBlog === blog.blogId && (
                            <button
                              onClick={() => removeCategory(blogIndex, categoryIndex)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 안내 섹션 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">사용 안내</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• 새 블로그 생성 시 기본 카테고리가 자동으로 추가됩니다</li>
                <li>• 카테고리는 언제든지 추가/삭제할 수 있습니다</li>
                <li>• 설정 변경 후 반드시 &quot;저장&quot; 버튼을 눌러주세요</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}