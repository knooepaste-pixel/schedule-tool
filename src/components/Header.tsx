import { useState } from 'react';
import { Course, Semester } from '../types';
import { DAY_NAMES_SHORT } from '../types';
import { getCurrentUser, getCurrentUserId, getUserSemesters, getUserSchedule } from '../utils/userStore';

interface HeaderProps {
  courses: Course[];
  semesters: Semester[];
  currentSemesterId: string;
  onImport: () => void;
  onExport: () => void;
  onUserSwitch: () => void;
  onSemesterManage: () => void;
  onSettings: () => void;
  onBackup: () => void;
  onAIChat: () => void;
  onClearAll: () => void;
  userName?: string;
  onLogout?: () => void;
}

export function Header({
  onImport,
  onExport,
  onUserSwitch,
  onSemesterManage,
  onSettings,
  onBackup,
  onAIChat,
  onClearAll,
  userName,
  onLogout,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUser = getCurrentUser();

  // 获取当前学期信息
  const currentSemester = (() => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return null;
      const semesters = getUserSemesters(userId);
      const userSchedule = getUserSchedule(userId);
      return semesters.find((s: Semester) => s.id === userSchedule.currentSemesterId);
    } catch {
      return null;
    }
  })();

  // 关闭菜单
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="bg-white border-b border-border px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: '#2D3436', lineHeight: 1.2 }}>
                {userName ? `${userName}的课表` : '我的课表'}
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: '#636E72' }}>
                {currentSemester?.name || '新学期'}
              </p>
            </div>
          </div>

          {/* 菜单按钮 */}
          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 rounded-lg border border-border bg-white hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* 菜单遮罩 */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={closeMenu}
        />
      )}

      {/* 侧边菜单 */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(userName || currentUser?.name)?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="font-medium" style={{ color: '#2D3436' }}>
                  {userName || currentUser?.name || '用户'}
                </div>
                <div className="text-xs" style={{ color: '#636E72' }}>
                  {currentSemester?.name || '新学期'}
                </div>
              </div>
            </div>
            <button onClick={closeMenu} className="p-2 rounded-lg hover:bg-gray-100">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="py-2">
          {/* 课表操作 */}
          <div className="px-4 py-2">
            <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#636E72' }}>
              课表操作
            </div>
          </div>

          <button
            onClick={() => { onImport(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium" style={{ color: '#2D3436' }}>导入课表</div>
              <div className="text-xs" style={{ color: '#636E72' }}>文本粘贴 / 图片识别 / 教务系统</div>
            </div>
          </button>

          <button
            onClick={() => { onExport(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0984E3" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium" style={{ color: '#2D3436' }}>导出课表</div>
              <div className="text-xs" style={{ color: '#636E72' }}>导出为 JSON 文件</div>
            </div>
          </button>

          <button
            onClick={() => { onAIChat(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium" style={{ color: '#2D3436' }}>AI 助手</div>
              <div className="text-xs" style={{ color: '#636E72' }}>智能问答与课程管理</div>
            </div>
          </button>

          {/* 分隔线 */}
          <div className="mx-4 my-2 border-t border-border" />

          {/* 系统设置 */}
          <div className="px-4 py-2">
            <div className="text-xs font-medium uppercase tracking-wide" style={{ color: '#636E72' }}>
              系统设置
            </div>
          </div>

          <button
            onClick={() => { onUserSwitch(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium" style={{ color: '#2D3436' }}>切换用户</div>
              <div className="text-xs" style={{ color: '#636E72' }}>多账户管理</div>
            </div>
          </button>

          <button
            onClick={() => { onSemesterManage(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium" style={{ color: '#2D3436' }}>学期管理</div>
              <div className="text-xs" style={{ color: '#636E72' }}>添加、切换、删除学期</div>
            </div>
          </button>

          <button
            onClick={() => { onSettings(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium" style={{ color: '#2D3436' }}>时间设置</div>
              <div className="text-xs" style={{ color: '#636E72' }}>自定义每节课时间</div>
            </div>
          </button>

          <button
            onClick={() => { onBackup(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium" style={{ color: '#2D3436' }}>数据备份</div>
              <div className="text-xs" style={{ color: '#636E72' }}>导出/导入数据备份</div>
            </div>
          </button>

          {/* 分隔线 */}
          <div className="mx-4 my-2 border-t border-border" />

          <button
            onClick={() => { onClearAll(); closeMenu(); }}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-medium text-red-600">清空课表</div>
              <div className="text-xs text-red-400">删除所有课程</div>
            </div>
          </button>

          {onLogout && userName && (
            <button
              onClick={() => { onLogout(); closeMenu(); }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-red-600">退出登录</div>
                <div className="text-xs text-red-400">切换其他账户</div>
              </div>
            </button>
          )}
        </div>
      </div>
    </>
  );
}