import { Course } from '../types';
import { DAY_NAMES } from '../types';

interface EmptyStateProps {
  hasCourses: boolean;
  onAddCourse: () => void;
  onImport: () => void;
}

export function EmptyState({ hasCourses, onAddCourse, onImport }: EmptyStateProps) {
  if (hasCourses) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="text-center max-w-md px-8">
        <div className="w-32 h-32 mx-auto mb-6 relative">
          <svg
            viewBox="0 0 120 120"
            fill="none"
            className="w-full h-full"
          >
            <rect
              x="20"
              y="30"
              width="80"
              height="70"
              rx="8"
              stroke="#E8ECEF"
              strokeWidth="2"
              fill="#FAFBFC"
            />
            <line
              x1="20"
              y1="50"
              x2="100"
              y2="50"
              stroke="#E8ECEF"
              strokeWidth="2"
            />
            <line
              x1="40"
              y1="30"
              x2="40"
              y2="100"
              stroke="#E8ECEF"
              strokeWidth="2"
            />
            <line
              x1="60"
              y1="30"
              x2="60"
              y2="100"
              stroke="#E8ECEF"
              strokeWidth="2"
            />
            <line
              x1="80"
              y1="30"
              x2="80"
              y2="100"
              stroke="#E8ECEF"
              strokeWidth="2"
            />
            <rect
              x="24"
              y="54"
              width="12"
              height="16"
              rx="2"
              fill="#74B9FF"
              opacity="0.6"
            />
            <rect
              x="44"
              y="54"
              width="12"
              height="12"
              rx="2"
              fill="#A29BFE"
              opacity="0.6"
            />
            <rect
              x="64"
              y="74"
              width="12"
              height="22"
              rx="2"
              fill="#55EFC4"
              opacity="0.6"
            />
            <rect
              x="84"
              y="54"
              width="12"
              height="16"
              rx="2"
              fill="#FD79A8"
              opacity="0.6"
            />
          </svg>
        </div>

        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: '#2D3436' }}
        >
          还没有课程
        </h2>
        <p
          className="text-sm mb-6"
          style={{ color: '#636E72' }}
        >
          开始添加你的课程，或者导入已有的课表文件
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onAddCourse}
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加课程
          </button>
          <button
            onClick={onImport}
            className="px-6 py-2.5 text-sm font-medium rounded-lg border border-border bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            style={{ color: '#2D3436' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            导入课表
          </button>
        </div>
      </div>
    </div>
  );
}