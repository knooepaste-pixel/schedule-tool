import { Course } from '../types';
import { DAY_NAMES } from '../types';
import { formatSectionTime } from '../utils/schedule';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
}

export function CourseDetailModal({ course, onClose, onEdit, onDelete }: CourseDetailModalProps) {
  if (!course) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-2"
          style={{ backgroundColor: course.color }}
        />

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: '#2D3436' }}>
                {course.name}
              </h2>
              <div
                className="text-sm"
                style={{ color: '#636E72' }}
              >
                {DAY_NAMES[course.dayOfWeek - 1]} · 第{formatSectionTime(course.startSection).split('-')[0]}节
                {course.startSection !== course.endSection && (
                  <> 至 第{formatSectionTime(course.endSection).split('-')[0]}节</>
                )}
              </div>
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: course.color }}
            />
          </div>

          <div className="space-y-3">
            {course.location && (
              <div className="flex items-center gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B2BEC3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="text-sm" style={{ color: '#636E72' }}>
                  {course.location}
                </span>
              </div>
            )}

            {course.teacher && (
              <div className="flex items-center gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B2BEC3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-sm" style={{ color: '#636E72' }}>
                  {course.teacher}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#B2BEC3"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-sm" style={{ color: '#636E72' }}>
                {course.endSection - course.startSection + 1} 节连堂
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={() => {
              onDelete(course.id);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-50 transition-colors"
          >
            删除
          </button>
          <button
            onClick={() => {
              onEdit(course);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
          >
            编辑
          </button>
        </div>
      </div>
    </div>
  );
}