import { memo } from 'react';
import { Course } from '../types';
import { SECTION_TIMES } from '../types';

interface CourseCardProps {
  course: Course;
  isSelected: boolean;
  onClick: () => void;
  sectionsCount: number;
  customTimes?: Record<number, { start: string; end: string }>;
}

export const CourseCard = memo(function CourseCard({
  course,
  isSelected,
  onClick,
  sectionsCount,
  customTimes,
}: CourseCardProps) {
  const height = (course.endSection - course.startSection + 1) * 80;
  const showLocation = course.location && sectionsCount >= 2;
  const showTeacher = course.teacher && sectionsCount >= 3;
  const showWeekRange = course.startWeek && course.endWeek && sectionsCount >= 2;

  // 获取课程时间显示
  const times = customTimes || SECTION_TIMES;
  const startTime = course.startTime || times[course.startSection]?.start || '';
  const endTime = course.endTime || times[course.endSection]?.end || '';

  // 考核类型图标
  const renderExamType = () => {
    if (course.examType === 'exam') {
      return (
        <div className="flex items-center gap-1" title="考试课">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span className="text-[10px]">考试</span>
        </div>
      );
    }
    return null;
  };

  // 上课方式图标
  const renderCourseMode = () => {
    const modeConfig = {
      online: { icon: '💻', label: '线上' },
      offline: { icon: '🏫', label: '线下' },
      hybrid: { icon: '🔄', label: '混合' },
    };
    const mode = modeConfig[course.courseMode || 'offline'];
    return (
      <div className="flex items-center gap-0.5" title={mode.label}>
        {course.courseMode === 'hybrid' ? (
          <>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </>
        ) : course.courseMode === 'online' ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        )}
      </div>
    );
  };

  return (
    <div
      className={`
        absolute left-0.5 right-0.5 rounded-lg cursor-pointer transition-all duration-150
        flex flex-col overflow-hidden
        ${isSelected
          ? 'ring-2 ring-offset-1 shadow-lg z-10'
          : 'hover:-translate-y-0.5 hover:shadow-md'
        }
      `}
      style={{
        top: 0,
        height: `${height}px`,
        backgroundColor: `${course.color}18`,
        borderLeft: `4px solid ${course.color}`,
        '--tw-ring-color': course.color,
      } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="p-1.5 h-full flex flex-col">
        {/* 顶部标签行 */}
        <div className="flex items-center justify-between gap-1 mb-auto">
          {/* 左上角标签 */}
          <div className="flex items-center gap-1">
            {renderExamType()}
            {renderCourseMode()}
          </div>
        </div>

        {/* 课程名称 - 居中大字 */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="text-center font-semibold leading-tight line-clamp-2"
            style={{
              color: '#2D3436',
              fontSize: sectionsCount >= 2 ? '0.875rem' : '0.75rem'
            }}
          >
            {course.name}
          </div>
        </div>

        {/* 底部信息 */}
        <div className="mt-auto space-y-0.5">
          {/* 教师和地点 */}
          <div className="flex items-center justify-center gap-1 text-[10px] truncate" style={{ color: '#636E72' }}>
            {showTeacher && course.teacher && (
              <>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="truncate max-w-[60px]">{course.teacher}</span>
              </>
            )}
            {showLocation && course.location && (
              <>
                {showTeacher && <span>·</span>}
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate max-w-[60px]">{course.location}</span>
              </>
            )}
          </div>

          {/* 周次范围 */}
          {showWeekRange && (
            <div className="text-center text-[10px] px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${course.color}20`, color: '#636E72' }}>
              {course.startWeek}-{course.endWeek}周
            </div>
          )}

          {/* 上课时间 */}
          <div className="text-center text-[10px]" style={{ color: '#B2BEC3' }}>
            {startTime && endTime ? `${startTime}-${endTime}` : `第${course.startSection}-${course.endSection}节`}
          </div>
        </div>
      </div>
    </div>
  );
});
