import { useState, useRef, useEffect } from 'react';

interface WeekSelectorProps {
  currentWeek: number;
  totalWeeks: number;
  onWeekChange: (week: number) => void;
  semesterStart: string;
}

export function WeekSelector({ currentWeek, totalWeeks, onWeekChange, semesterStart }: WeekSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 计算当前是第几周
  const getCurrentWeekNumber = (): number => {
    const start = new Date(semesterStart);
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return Math.max(1, Math.min(totalWeeks, week));
  };

  // 获取本周的日期范围
  const getWeekDateRange = (week: number) => {
    const start = new Date(semesterStart);
    start.setDate(start.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const actualCurrentWeek = getCurrentWeekNumber();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border hover:bg-gray-50 transition-colors shadow-sm"
      >
        <span className="text-sm font-medium" style={{ color: '#2D3436' }}>
          第{currentWeek}周
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#636E72"
          strokeWidth="2"
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-border z-50 overflow-hidden">
          {/* 头部信息 */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color: '#2D3436' }}>
                  第{currentWeek}周 · {getWeekDateRange(currentWeek)}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#636E72' }}>
                  共{totalWeeks}周 · 第{actualCurrentWeek}周为实际当前周
                </div>
              </div>
            </div>
          </div>

          {/* 周数网格 */}
          <div className="p-3">
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
                <button
                  key={week}
                  onClick={() => {
                    onWeekChange(week);
                    setIsOpen(false);
                  }}
                  className={`
                    relative p-2 rounded-lg text-center transition-all
                    ${week === currentWeek
                      ? 'bg-accent text-white shadow-md'
                      : week === actualCurrentWeek
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="text-sm font-medium">第{week}周</span>
                  {week === actualCurrentWeek && week !== currentWeek && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 底部操作 */}
          <div className="px-3 pb-3 flex gap-2">
            <button
              onClick={() => {
                onWeekChange(actualCurrentWeek);
                setIsOpen(false);
              }}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            >
              跳转至实际当前周
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
