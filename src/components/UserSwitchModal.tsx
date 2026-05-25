import { useState, useEffect } from 'react';
import { User } from '../types';
import {
  getAllUsers,
  addUser,
  deleteUser,
  getCurrentUser,
  setCurrentUser,
} from '../utils/userStore';

interface UserSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSwitch: () => void;
}

export function UserSwitchModal({ isOpen, onClose, onUserSwitch }: UserSwitchModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrent] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = () => {
    setUsers(getAllUsers());
    setCurrent(getCurrentUser());
  };

  const handleSwitchUser = (userId: string) => {
    setCurrentUser(userId);
    setCurrent(getAllUsers().find((u) => u.id === userId) || null);
    onUserSwitch();
    onClose();
  };

  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    const newUser = addUser(newUserName.trim());
    setUsers([...users, newUser]);
    setNewUserName('');
    setShowAddForm(false);
    // 自动切换到新用户
    handleSwitchUser(newUser.id);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) {
      alert('至少需要保留一个用户');
      return;
    }
    const success = deleteUser(userId);
    if (success) {
      loadUsers();
      if (currentUser?.id === userId) {
        onUserSwitch();
      }
    }
    setDeleteConfirm(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#2D3436' }}>
                切换用户
              </h2>
              <p className="text-xs" style={{ color: '#636E72' }}>
                选择或创建新用户
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 用户列表 */}
        <div className="max-h-80 overflow-y-auto p-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-xl mb-2 transition-all ${
                currentUser?.id === user.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentUser?.id === user.id
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}>
                  <span className={`text-sm font-medium ${currentUser?.id === user.id ? 'text-white' : 'text-gray-600'}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium" style={{ color: '#2D3436' }}>
                    {user.name}
                    {currentUser?.id === user.id && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                        使用中
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: '#636E72' }}>
                    创建于 {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSwitchUser(user.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    currentUser?.id === user.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-blue-500 text-blue-500 hover:bg-blue-50'
                  }`}
                >
                  {currentUser?.id === user.id ? '当前' : '切换'}
                </button>
                {users.length > 1 && (
                  deleteConfirm === user.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-1.5 rounded-lg bg-gray-300 text-gray-600 hover:bg-gray-400 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(user.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 添加新用户 */}
        <div className="p-4 border-t border-border bg-gray-50">
          {showAddForm ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="输入用户名"
                className="flex-1 px-4 py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddUser();
                  if (e.key === 'Escape') setShowAddForm(false);
                }}
              />
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors active:scale-95"
              >
                添加
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewUserName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-xl text-blue-500 font-medium hover:bg-blue-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加新用户
            </button>
          )}
        </div>

        {/* 删除确认提示 */}
        {deleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white p-4 rounded-xl max-w-xs mx-4">
              <p className="text-sm text-gray-600 mb-4">
                确定要删除这个用户吗？<br />
                <strong className="text-red-500">此操作不可撤销</strong>，该用户的所有课表数据都将被删除。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteUser(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
