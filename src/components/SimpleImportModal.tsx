import { useState } from 'react';
import { Course } from '../types';
import { useSchedule } from '../hooks/useSchedule';
import { parseSimpleFormat, SAMPLE_COURSES } from '../utils/simpleParser';

interface SimpleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleImportModal({ isOpen, onClose }: SimpleImportModalProps) {
  const { importCourses } = useSchedule();
  const [input, setInput] = useState('');

  const handleImport = () => {
    const courses = parseSimpleFormat(input);
    if (courses.length === 0) {
      return;
    }
    importCourses(courses);
    onClose();
    setInput('');
  };

  const handleLoadSample = () => {
    const sampleText = SAMPLE_COURSES
      .map(c => `${c.name}，周${['一', '二', '三', '四', '五', '六', '日'][c.dayOfWeek - 1]}，第${c.startSection}-${c.endSection}节${c.location ? '，' + c.location : ''}`)
      .join('\n');
    setInput(sampleText);
  };

  const handleQuickAdd = (course: typeof SAMPLE_COURSES[0]) => {
    const text = `${course.name}，周${['一', '二', '三', '四', '五', '六', '日'][course.dayOfWeek - 1]}，第${course.startSection}-${course.endSection}节${course.location ? '，' + course.location : ''}`;
    const currentInput = input.trim();
    setInput(currentInput ? currentInput + '\n' + text : text);
  };

  const previewCourses = input.trim() ? parseSimpleFormat(input) : [];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-screen sm:max-h-[90vh] h-full sm:h-auto flex flex-col mobile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#2D3436' }}>
              快速添加课程
            </h2>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#636E72' }}>
              输入课程名称、星期和节次即可
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#636E72"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto sm:overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* 快速添加示例 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: '#2D3436' }}>
                快速添加
              </span>
              <button
                onClick={handleLoadSample}
                className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                加载示例
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_COURSES.slice(0, 4).map((course, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAdd(course)}
                  className="text-left p-2 rounded-lg border border-border hover:border-accent hover:bg-accent/5 transition-colors"
                >
                  <div className="text-sm font-medium truncate" style={{ color: '#2D3436' }}>
                    {course.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#636E72' }}>
                    周{['一', '二', '三', '四', '五', '六', '日'][course.dayOfWeek - 1]} {course.startSection}-{course.endSection}节
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2" style={{ color: '#636E72' }}>
                或手动输入
              </span>
            </div>
          </div>

          {/* 输入区域 */}
          <div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`每行一门课程，格式：课程名，星期，节次

例如：
高等数学，周一，1-2节
线性代数，周二，3-4节，教学楼A101
大学英语，周三，1-2节`}
              className="w-full h-40 p-3 text-sm border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono"
              style={{ color: '#2D3436' }}
            />
            <div className="text-xs mt-1" style={{ color: '#B2BEC3' }}>
              支持多种分隔符：逗号、空格、顿号
            </div>
          </div>

          {/* 预览 */}
          {previewCourses.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-green-50 border-b border-border">
                <span className="text-sm font-medium text-green-700">
                  预览 ({previewCourses.length} 门课程)
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {previewCourses.map((course) => (
                  <div
                    key={course.id}
                    className="px-4 py-2 border-b border-border last:border-b-0 flex items-center gap-3"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: '#2D3436' }}>
                        {course.name}
                      </div>
                      <div className="text-xs" style={{ color: '#636E72' }}>
                        周{['一', '二', '三', '四', '五', '六', '日'][course.dayOfWeek - 1]} · 第{course.startSection}-{course.endSection}节
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
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            添加 {previewCourses.length > 0 ? `${previewCourses.length} 门课程` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
