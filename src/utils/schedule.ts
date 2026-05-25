import { Course, Schedule, COURSE_COLORS, generateId } from '../types';

export { COURSE_COLORS, generateId } from '../types';

const STORAGE_KEY = 'campus_schedule_data';

export function getDefaultSchedule(): Schedule {
  return {
    courses: [],
    currentWeek: 1,
    totalWeeks: 16,
    semesterStart: new Date().toISOString().split('T')[0],
  };
}

export function loadSchedule(): Schedule {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load schedule:', e);
  }
  return getDefaultSchedule();
}

export function saveSchedule(schedule: Schedule): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  } catch (e) {
    console.error('Failed to save schedule:', e);
  }
}

export function getNextColor(existingCourses: Course[]): string {
  const usedColors = new Set(existingCourses.map((c) => c.color));
  for (const color of COURSE_COLORS) {
    if (!usedColors.has(color)) {
      return color;
    }
  }
  return COURSE_COLORS[existingCourses.length % COURSE_COLORS.length];
}

export function parseCoursesFromJSON(json: string): Course[] {
  try {
    const data = JSON.parse(json);
    if (Array.isArray(data.courses)) {
      return data.courses.map((c: Partial<Course>) => ({
        id: generateId(),
        name: c.name || '未命名课程',
        teacher: c.teacher,
        location: c.location,
        dayOfWeek: Math.min(7, Math.max(1, c.dayOfWeek || 1)) as Course['dayOfWeek'],
        startSection: Math.min(16, Math.max(1, c.startSection || 1)),
        endSection: Math.min(16, Math.max(1, c.endSection || c.startSection || 1)),
        color: c.color || COURSE_COLORS[0],
        weeks: c.weeks,
      }));
    }
    if (Array.isArray(data)) {
      return data.map((c: Partial<Course>, index: number) => ({
        id: generateId(),
        name: c.name || '未命名课程',
        teacher: c.teacher,
        location: c.location,
        dayOfWeek: Math.min(7, Math.max(1, c.dayOfWeek || 1)) as Course['dayOfWeek'],
        startSection: Math.min(16, Math.max(1, c.startSection || 1)),
        endSection: Math.min(16, Math.max(1, c.endSection || c.startSection || 1)),
        color: c.color || COURSE_COLORS[index % COURSE_COLORS.length],
        weeks: c.weeks,
      }));
    }
  } catch (e) {
    console.error('Failed to parse JSON:', e);
  }
  return [];
}

export function exportScheduleToJSON(schedule: Schedule): string {
  return JSON.stringify(
    {
      courses: schedule.courses.map((c) => ({
        name: c.name,
        teacher: c.teacher,
        location: c.location,
        dayOfWeek: c.dayOfWeek,
        startSection: c.startSection,
        endSection: c.endSection,
        color: c.color,
        weeks: c.weeks,
      })),
    },
    null,
    2
  );
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getWeekNumber(semesterStart: string): number {
  const start = new Date(semesterStart);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7));
}

export function getCurrentTimePosition(): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = (hours - 8) * 60 + minutes;
  return Math.max(0, Math.min(100, (totalMinutes / (13 * 60)) * 100));
}

export function formatSectionTime(section: number): string {
  // 与 types/index.ts SECTION_TIMES 和 userStore.ts DEFAULT_SECTION_TIMES 保持一致
  const times: Record<number, string> = {
    1: '08:15-08:55',
    2: '09:00-09:40',
    3: '09:50-10:30',
    4: '10:40-11:20',
    5: '11:25-12:05',
    6: '13:30-14:10',
    7: '14:15-14:55',
    8: '15:00-15:40',
    9: '15:45-16:25',
    10: '18:30-19:10',
    11: '19:15-19:55',
    12: '20:00-20:40',
    13: '08:15-08:55',
    14: '09:00-09:40',
    15: '09:50-10:30',
    16: '10:40-11:20',
  };
  return times[section] || '';
}

// 解析HTML格式教务系统课表（正方、青书等）
export function parseCoursesFromHTML(html: string): Course[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const courses: Course[] = [];

    // 尝试查找课表表格
    const tables = doc.querySelectorAll('table');
    let courseIndex = 0;

    for (const table of tables) {
      const rows = table.querySelectorAll('tr');
      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
          // 教务系统课表通常包含：课程名、星期、节次、地点、教师等
          const cellsText = Array.from(cells).map(c => c.textContent?.trim() || '');

          // 解析星期几上课
          const dayMatch = cellsText.find(text => /周|星期一|星期二|星期三|星期四|星期五|星期六|星期日/.test(text));
          let dayOfWeek: number | null = null;

          if (dayMatch) {
            if (/一|星期一|Monday|1/.test(dayMatch)) dayOfWeek = 1;
            else if (/二|星期二|Tuesday|2/.test(dayMatch)) dayOfWeek = 2;
            else if (/三|星期三|Wednesday|3/.test(dayMatch)) dayOfWeek = 3;
            else if (/四|星期四|Thursday|4/.test(dayMatch)) dayOfWeek = 4;
            else if (/五|星期五|Friday|5/.test(dayMatch)) dayOfWeek = 5;
            else if (/六|星期六|Saturday|6/.test(dayMatch)) dayOfWeek = 6;
            else if (/日|星期日|Sunday|7/.test(dayMatch)) dayOfWeek = 7;
          }

          // 解析节次
          const sectionMatch = cellsText.find(text => /\d+-\d+节|\d+-\d+节课|第?\d+-\d+节/.test(text));
          let startSection = 1;
          let endSection = 1;

          if (sectionMatch) {
            const sectionNumbers = sectionMatch.match(/\d+/g);
            if (sectionNumbers && sectionNumbers.length >= 2) {
              startSection = parseInt(sectionNumbers[0]);
              endSection = parseInt(sectionNumbers[1]);
            } else if (sectionNumbers && sectionNumbers.length === 1) {
              startSection = endSection = parseInt(sectionNumbers[0]);
            }
          }

          // 查找课程名称（通常在第一列或包含特定关键词）
          const nameMatch = cellsText.find(text =>
            text && !/周|节|教室|地点|教师|学分|学时/.test(text) && text.length > 1 && text.length < 50
          );

          if (nameMatch && dayOfWeek) {
            courses.push({
              id: generateId(),
              name: nameMatch.replace(/\s+/g, ' ').trim(),
              location: cellsText.find(t => /教室|教室号|地点|场地|楼|室/.test(t)) || undefined,
              teacher: cellsText.find(t => /教师|老师|讲师|教授/.test(t)) || undefined,
              dayOfWeek: dayOfWeek as Course['dayOfWeek'],
              startSection,
              endSection,
              color: COURSE_COLORS[courseIndex % COURSE_COLORS.length],
            });
            courseIndex++;
          }
        }
      }
    }

    // 如果没找到表格，尝试解析其他常见格式
    if (courses.length === 0) {
      // 尝试从 div 或其他元素中解析
      const allText = doc.body?.textContent || '';

      // 匹配常见课程格式
      const coursePattern = /([^\s,，、]+)\s*[，,]\s*(?:周)?[一二三四五六日](?:星期)?\s*第?\s*(\d+)\s*[-到至]\s*第?\s*(\d+)\s*[节节课]/g;
      let match;

      while ((match = coursePattern.exec(allText)) !== null) {
        courses.push({
          id: generateId(),
          name: match[1],
          startSection: parseInt(match[2]),
          endSection: parseInt(match[3]),
          dayOfWeek: 1,
          color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
        });
      }
    }

    return courses;
  } catch (e) {
    console.error('Failed to parse HTML:', e);
  }
  return [];
}

// 解析iCal格式 (.ics)
export function parseCoursesFromICal(ical: string): Course[] {
  try {
    const courses: Course[] = [];
    const lines = ical.split(/\r?\n/);
    let currentEvent: Record<string, string> = {};
    let inEvent = false;

    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        inEvent = true;
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT')) {
        inEvent = false;

        if (currentEvent.summary) {
          // 解析RRULE获取重复信息
          const dayMap: Record<string, number> = {
            MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7
          };

          let dayOfWeek = 1;
          const rrule = currentEvent.rrule || '';
          const byday = rrule.match(/BYDAY=([A-Z,]+)/)?.[1];

          if (byday) {
            const days = byday.split(',');
            if (days[0] && dayMap[days[0]]) {
              dayOfWeek = dayMap[days[0]];
            }
          }

          // 解析DTSTART获取时间
          const dtstart = currentEvent.dtstart || '';
          const startSection = parseInt(dtstart.match(/T(\d{2})(\d{2})/)?.[1] || '8') - 7;

          courses.push({
            id: generateId(),
            name: currentEvent.summary,
            location: currentEvent.location,
            teacher: currentEvent.organizer,
            dayOfWeek: dayOfWeek as Course['dayOfWeek'],
            startSection: Math.max(1, startSection),
            endSection: Math.max(1, startSection),
            color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
          });
        }
      } else if (inEvent) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).split(';')[0];
          const value = line.substring(colonIndex + 1);
          currentEvent[key] = value;
        }
      }
    }

    return courses;
  } catch (e) {
    console.error('Failed to parse iCal:', e);
  }
  return [];
}

// 自动检测并解析各种格式
export function parseCoursesFromAny(content: string): Course[] {
  const trimmed = content.trim();

  // 检测格式
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    // JSON格式
    return parseCoursesFromJSON(trimmed);
  } else if (trimmed.startsWith('BEGIN:VCALENDAR') || trimmed.startsWith('BEGIN:VEVENT')) {
    // iCal格式
    return parseCoursesFromICal(trimmed);
  } else if (trimmed.startsWith('<') || trimmed.includes('<html') || trimmed.includes('<table')) {
    // HTML格式
    return parseCoursesFromHTML(trimmed);
  }

  // 默认尝试JSON
  return parseCoursesFromJSON(trimmed);
}