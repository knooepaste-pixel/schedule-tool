import { useState, useEffect } from 'react';
import { Course } from '../types';
import { useSchedule } from '../hooks/useSchedule';
import { parseWithAI, saveAIConfig, getAIConfig } from '../utils/aiParser';

interface AIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIImportModal({ isOpen, onClose }: AIImportModalProps) {
  const { importCourses } = useSchedule();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCourses, setPreviewCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [hasConfig, setHasConfig] = useState(false);

  // AI配置 - 复用已保存的配置
  const [apiType, setApiType] = useState<'openai' | 'qwen' | 'deepseek'>('deepseek');
  const [apiKey, setApiKey] = useState('');

  // 加载保存的配置
  useEffect(() => {
    const config = getAIConfig();
    if (config) {
      setApiType(config.apiType as 'openai' | 'qwen' | 'deepseek');
      setApiKey(config.apiKey);
      setHasConfig(true);
    } else {
      setHasConfig(false);
    }
  }, [isOpen]);

  const handleParse = async () => {
    if (!text.trim()) {
      setError('请输入课表文字');
      return;
    }
    if (!apiKey.trim()) {
      setError('请先在AI助手中配置API密钥');
      return;
    }

    setIsProcessing(true);
    setError('');
    setStatus('正在使用AI解析课表...');
    setPreviewCourses([]);

    try {
      // 保存配置
      saveAIConfig({ apiType, apiKey });

      const courses = await parseWithAI(text, apiKey, apiType);
      setPreviewCourses(courses);

      if (courses.length === 0) {
        setError('未能解析出课程信息，请检查输入格式');
      } else {
        setStatus(`成功解析 ${courses.length} 门课程`);
      }
    } catch (err: any) {
      console.error('AI解析失败:', err);
      setError(err.message || 'AI解析失败，请检查API密钥是否正确');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (previewCourses.length === 0) {
      setError('没有可导入的课程');
      return;
    }
    importCourses(previewCourses);
    onClose();
    setText('');
    setPreviewCourses([]);
    setError('');
    setStatus('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-screen sm:max-h-[90vh] h-full sm:h-auto flex flex-col mobile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#2D3436' }}>
              AI智能导入课表
            </h2>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#636E72' }}>
              使用AI智能解析课表文字
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto sm:overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* 配置提示 */}
          {!hasConfig || !apiKey.trim() ? (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">需要配置API密钥</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    请先在AI助手中配置API密钥，配置一次后会自动保存。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 rounded-xl p-3 border border-green-200 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs text-green-700">
                已配置 {apiType === 'deepseek' ? 'DeepSeek' : apiType === 'qwen' ? '通义千问' : 'OpenAI'} API
              </span>
            </div>
          )}

          {/* 文字输入 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2D3436' }}>
              粘贴课表文字
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`直接粘贴从课表App或教务系统复制的课程信息

例如：
旅游规划与开发 周一 第1-2节 望院D311
会计学原理 周一 第3-4节 望院D311
研学旅行项目设计 周三 第1-2节 望院C102
全球治理英语（一） 周三 第3-5节 望院C102`}
              className="w-full h-40 p-3 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
              style={{ color: '#2D3436' }}
            />
          </div>

          {/* 解析按钮 */}
          <button
            onClick={handleParse}
            disabled={isProcessing || !text.trim() || !apiKey.trim()}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                {status || 'AI解析中...'}
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                使用AI解析
              </>
            )}
          </button>

          {/* 错误/状态提示 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {status && !error && (
            <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {status}
            </div>
          )}

          {/* 预览 */}
          {previewCourses.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-green-50 border-b border-border">
                <span className="text-sm font-medium text-green-700">
                  预览 ({previewCourses.length} 门课程)
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {previewCourses.map((course) => (
                  <div key={course.id} className="px-4 py-2 border-b border-border last:border-b-0 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#2D3436' }}>
                        {course.name}
                      </div>
                      <div className="text-xs" style={{ color: '#636E72' }}>
                        周{course.dayOfWeek} · 第{course.startSection}-{course.endSection}节
                        {course.location && ` · ${course.location}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-gray-50/50 flex justify-end gap-3 flex-shrink-0 safe-area-bottom">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-gray-100 transition-colors"
            style={{ color: '#636E72' }}
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={previewCourses.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            导入 {previewCourses.length > 0 ? `${previewCourses.length} 门课程` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}