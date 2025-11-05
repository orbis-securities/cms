"use client";

interface ProfileInfoProps {
  user: {
    name?: string;
    email?: string;
  } | null;
}

export default function ProfileInfo({ user }: ProfileInfoProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6">계정 정보</h2>

      <div className="space-y-6">
        {/* 프로필 사진 */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user?.name || '사용자'}
            </h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* 계정 상세 정보 */}
        <div className="border-t pt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
