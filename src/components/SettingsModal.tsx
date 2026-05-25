import { useState, useEffect } from 'react';
import { useSchedule } from '../hooks/useSchedule';
import { DEFAULT_SECTION_TIMES } from '../utils/userStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { customTimes, setCustomTimes } = useSchedule();

  // 编辑中的时间配置
  const [editingTimes, setEditingTimes] = useState<Record<number, { start: string; end: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingTimes({ ...customTimes });
      setHasChanges(false);
    }
  }, [isOpen, customTimes]);

  const handleTimeChange = (section: number, field: 'start' | 'end', value: string) => {
    setEditingTimes(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setCustomTimes(editingTimes);
    setHasChanges(false);
    onClose();
  };

  const handleReset = () => {
    setEditingTimes({ ...DEFAULT_SECTION_TIMES });
    setHasChanges(true);
  };

  if (!isOpen) return null;

  // 显示前16节课的配置
  const sections = Array.from({ length: 16 }, (_, i) => i + 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-xl sm:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-screen sm:max-h-[90vh] h-full sm:h-auto flex flex-col mobile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#2D3436' }}>
              时间设置
            </h2>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#636E72' }}>
              自定义每节课的上课时间
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto sm:overflow-y-auto p-4 sm:p-6">
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-border"
              >
                <div className="w-16 text-sm font-medium" style={{ color: '#2D3436' }}>
                  第{section}节
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="time"
                    value={editingTimes[section]?.start || ''}
                    onChange={(e) => handleTimeChange(section, 'start', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                    style={{ color: '#2D3436' }}
                  />
                  <span className="text-sm" style={{ color: '#B2BEC3' }}>至</span>
                  <input
                    type="time"
                    value={editingTimes[section]?.end || ''}
                    onChange={(e) => handleTimeChange(section, 'end', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                    style={{ color: '#2D3436' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
            <div className="flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-yellow-700">
                设置会自动保存，下次打开应用时会保持你配置的时间。上传课表时如果包含具体时间信息，也会自动同步到左侧时间栏。
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-gray-50/50 flex justify-between gap-3 flex-shrink-0 safe-area-bottom">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-gray-100 transition-colors"
            style={{ color: '#636E72' }}
          >
            恢复默认
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-gray-100 transition-colors"
              style={{ color: '#636E72' }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}