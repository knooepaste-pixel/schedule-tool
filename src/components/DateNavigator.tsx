import { useMemo } from 'react';
import { DAY_NAMES } from '../types';

interface DateNavigatorProps {
  currentWeek: number;
  semesterStart: string;
  onWeekChange: (week: number) => void;
}

export function DateNavigator({ currentWeek, semesterStart, onWeekChange }: DateNavigatorProps) {
  // 计算当前周的日期
  const weekDates = useMemo(() => {
    const start = new Date(semesterStart);
    start.setDate(start.getDate() + (currentWeek - 1) * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      return {
        dayName: DAY_NAMES[i],
        date: date.getDate(),
        month: date.getMonth() + 1,
        dayOfWeek: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7,
        isToday: isToday(date),
      };
    });
  }, [currentWeek, semesterStart]);

  // 判断是否是今天
  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  return (
    <div className="bg-white border-b border-border px-4 py-2">
      <div className="flex items-center gap-2">
        {/* 上一周按钮 */}
        <button
          onClick={() => onWeekChange(Math.max(1, currentWeek - 1))}
          disabled={currentWeek <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* 日期条 */}
        <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide">
          {weekDates.map((item) => (
            <button
              key={item.dayOfWeek}
              className={`
                flex-1 min-w-0 px-2 py-1.5 rounded-lg text-center transition-all
                ${item.isToday
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100'
                }
              `}
            >
              <div className={`text-xs ${item.isToday ? 'text-white/80' : 'text-gray-500'}`}>
                {item.dayName}
              </div>
              <div className={`text-sm font-medium ${item.isToday ? 'text-white' : 'text-gray-700'}`}>
                {item.date}
              </div>
            </button>
          ))}
        </div>

        {/* 下一周按钮 */}
        <button
          onClick={() => onWeekChange(currentWeek + 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
