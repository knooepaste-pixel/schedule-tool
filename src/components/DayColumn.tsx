import { Course } from '../types';
import { CourseCard } from './CourseCard';

interface DayColumnProps {
  dayIndex: number;
  courses: Course[];
  selectedCourseId: string | null;
  onCourseClick: (course: Course) => void;
  isWeekend: boolean;
  customTimes?: Record<number, { start: string; end: string }>;
}

export function DayColumn({
  dayIndex,
  courses,
  selectedCourseId,
  onCourseClick,
  isWeekend,
  customTimes,
}: DayColumnProps) {
  const maxSection = 12;

  return (
    <div
      className={`
        relative flex-1 min-w-0 border-r border-border last:border-r-0
        ${isWeekend ? 'bg-gray-50/50' : ''}
      `}
    >
      {Array.from({ length: maxSection }, (_, sectionIndex) => (
        <div
          key={sectionIndex}
          className={`
            h-20 border-b border-border last:border-b-0
            ${sectionIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}
          `}
        />
      ))}

      {courses.map((course) => (
        <div
          key={course.id}
          className="absolute w-full px-0.5"
          style={{
            top: `${(course.startSection - 1) * 80}px`,
          }}
        >
          <CourseCard
            course={course}
            isSelected={selectedCourseId === course.id}
            onClick={() => onCourseClick(course)}
            sectionsCount={course.endSection - course.startSection + 1}
            customTimes={customTimes}
          />
        </div>
      ))}
    </div>
  );
}