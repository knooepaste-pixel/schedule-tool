import { useState } from 'react';
import { Course, DAY_NAMES, DAY_NAMES_SHORT } from '../types';
import { TimeColumn } from './TimeColumn';
import { DayColumn } from './DayColumn';
import { EmptyState } from './EmptyState';
import { WeekSelector } from './WeekSelector';
import { DateNavigator } from './DateNavigator';

interface ScheduleTableProps {
  courses: Course[];
  selectedCourse: Course | null;
  currentWeek: number;
  totalWeeks: number;
  semesterStart: string;
  onWeekChange: (week: number) => void;
  onCourseClick: (course: Course) => void;
  onAddCourse: () => void;
  onImport: () => void;
  customTimes?: Record<number, { start: string; end: string }>;
}

export function ScheduleTable({
  courses,
  selectedCourse,
  currentWeek,
  totalWeeks,
  semesterStart,
  onWeekChange,
  onCourseClick,
  onAddCourse,
  onImport,
  customTimes,
}: ScheduleTableProps) {
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return today === 0 ? 7 : today;
  });

  // 计算课程中最大的节次
  const maxSectionInCourses = courses.reduce((max, course) => {
    return Math.max(max, course.endSection);
  }, 12);
  const maxSection = Math.max(12, maxSectionInCourses);

  // 根据当前周过滤课程
  const getCoursesByDay = (day: number) => {
    return courses.filter((c) => {
      if (c.dayOfWeek !== day) return false;
      if (!c.weeks || c.weeks.length === 0) return true;
      return c.weeks.includes(currentWeek);
    });
  };

  const coursesByActiveDay = getCoursesByDay(activeDay);

  return (
    <div className="flex-1 flex flex-col">
      {/* 周数选择器 */}
      <div className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
        <WeekSelector
          currentWeek={currentWeek}
          totalWeeks={totalWeeks}
          onWeekChange={onWeekChange}
          semesterStart={semesterStart}
        />
        <div className="text-sm" style={{ color: '#636E72' }}>
          第{currentWeek}周
        </div>
      </div>

      {/* 日期导航条 */}
      <DateNavigator
        currentWeek={currentWeek}
        semesterStart={semesterStart}
        onWeekChange={onWeekChange}
      />

      {/* Desktop view: full week table */}
      <div className="hidden md:flex flex-1 overflow-auto">
        <div className="min-w-[640px] flex-1">
          <div className="sticky top-0 bg-white z-10 flex border-b border-border">
            <div className="w-16 flex-shrink-0" />
            {DAY_NAMES.map((day, index) => {
              const isWeekend = index >= 5;
              const hasCourses = getCoursesByDay(index + 1).length > 0;
              return (
                <div
                  key={day}
                  className={`
                    flex-1 py-3 text-center text-sm font-medium border-r border-border last:border-r-0
                    ${isWeekend ? 'bg-gray-50/50' : ''}
                  `}
                  style={{ color: '#2D3436' }}
                >
                  <div>{day}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#B2BEC3' }}>
                    {DAY_NAMES_SHORT[index]}
                    {hasCourses && ' ·'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex relative" style={{ height: `${maxSection * 80}px` }}>
            <TimeColumn maxSection={maxSection} customTimes={customTimes} />
            {DAY_NAMES.map((_, index) => (
              <DayColumn
                key={index}
                dayIndex={index}
                courses={getCoursesByDay(index + 1)}
                selectedCourseId={selectedCourse?.id || null}
                onCourseClick={onCourseClick}
                isWeekend={index >= 5}
                customTimes={customTimes}
              />
            ))}

            <EmptyState
              hasCourses={courses.length > 0}
              onAddCourse={onAddCourse}
              onImport={onImport}
            />
          </div>
        </div>
      </div>

      {/* Mobile view: single day schedule */}
      <div className="md:hidden flex-1 flex flex-col bg-gray-50/30">
        <div className="px-3 py-2 bg-white border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color: '#2D3436' }}>
            {DAY_NAMES[activeDay - 1]}
          </div>
          <div className="text-xs" style={{ color: '#636E72' }}>
            {coursesByActiveDay.length} 门课程
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex">
            <TimeColumn maxSection={maxSection} customTimes={customTimes} />
            <div className="flex-1">
              {coursesByActiveDay.length > 0 ? (
                <DayColumn
                  dayIndex={activeDay - 1}
                  courses={coursesByActiveDay}
                  selectedCourseId={selectedCourse?.id || null}
                  onCourseClick={onCourseClick}
                  isWeekend={activeDay >= 6}
                  customTimes={customTimes}
                />
              ) : (
                <div className="h-full flex items-center justify-center" style={{ height: `${maxSection * 80}px` }}>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B2BEC3" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="text-sm" style={{ color: '#636E72' }}>
                      今日无课程
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Day selector tabs */}
        <div className="bg-white border-t border-border px-2 py-2">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {DAY_NAMES.map((day, index) => {
              const dayNumber = index + 1;
              const isActive = dayNumber === activeDay;
              const isWeekend = index >= 5;
              const dayCourses = getCoursesByDay(dayNumber);

              return (
                <button
                  key={day}
                  onClick={() => setActiveDay(dayNumber)}
                  className={`
                    flex-shrink-0 px-3 py-2 rounded-lg text-center transition-all text-xs
                    ${isActive
                      ? 'bg-accent text-white'
                      : isWeekend
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-blue-50 text-gray-600'
                    }
                  `}
                >
                  <div className="font-medium">{DAY_NAMES_SHORT[index]}</div>
                  <div className="text-xs opacity-70">{day.slice(1)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick navigation arrows */}
        <div className="fixed bottom-20 left-0 right-0 flex justify-between px-4 pointer-events-none">
          <button
            onClick={() => setActiveDay(Math.max(1, activeDay - 1))}
            disabled={activeDay === 1}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-auto disabled:opacity-30"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => setActiveDay(Math.min(7, activeDay + 1))}
            disabled={activeDay === 7}
            className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center pointer-events-auto disabled:opacity-30"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
