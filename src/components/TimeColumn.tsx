import { SECTION_TIMES } from '../types';

interface TimeColumnProps {
  maxSection?: number;
  customTimes?: Record<number, { start: string; end: string }>;
}

export function TimeColumn({ maxSection = 12, customTimes }: TimeColumnProps) {
  const times = customTimes || SECTION_TIMES;

  return (
    <div className="w-16 flex-shrink-0 relative bg-white border-r border-border sticky left-0 z-20">
      <div className="relative h-full">
        {Array.from({ length: maxSection }, (_, index) => {
          const section = index + 1;
          const time = times[section];

          return (
            <div
              key={section}
              className="h-20 border-b border-border last:border-b-0 flex flex-col items-center justify-center pr-2"
            >
              <span
                className="text-xs font-medium tabular-nums"
                style={{ color: '#2D3436' }}
              >
                {time?.start || ''}
              </span>
              <span
                className="text-xs tabular-nums"
                style={{ color: '#B2BEC3' }}
              >
                {time?.end || ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
