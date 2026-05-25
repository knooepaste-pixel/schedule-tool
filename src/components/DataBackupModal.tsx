import { useState } from 'react';
import { exportUserData, importUserData } from '../utils/userStore';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataBackupModal({ isOpen, onClose }: DataBackupModalProps) {
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleExport = () => {
    try {
      const userId = localStorage.getItem('schedule_current_user');
      if (!userId) {
        setMessage('请先登录');
        setMessageType('error');
        return;
      }

      const data = exportUserData(userId);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `课表备份_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage('导出成功！请保存好备份文件');
      setMessageType('success');
    } catch (error) {
      setMessage('导出失败');
      setMessageType('error');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const success = importUserData(text);
        if (success) {
          setMessage('导入成功！请刷新页面查看数据');
          setMessageType('success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage('导入失败，文件格式不正确');
          setMessageType('error');
        }
      } catch {
        setMessage('导入失败，无法读取文件');
        setMessageType('error');
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#2D3436' }}>
              数据备份
            </h2>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#636E72' }}>
              导出或导入你的课表数据
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* 导出按钮 */}
          <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium" style={{ color: '#2D3436' }}>导出备份</h3>
                <p className="text-xs text-gray-400 mt-0.5">将当前数据保存为JSON文件</p>
              </div>
              <button
                onClick={handleExport}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                导出
              </button>
            </div>
          </div>

          {/* 导入按钮 */}
          <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00B894" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium" style={{ color: '#2D3436' }}>导入备份</h3>
                <p className="text-xs text-gray-400 mt-0.5">从之前导出的文件恢复数据</p>
              </div>
              <button
                onClick={handleImport}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
              >
                导入
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message}
            </div>
          )}

          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-yellow-700">
                建议定期导出备份，以防浏览器数据被清除。导入会创建新的用户，不会覆盖现有数据。
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-gray-100 transition-colors"
            style={{ color: '#636E72' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}