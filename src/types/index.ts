export type ExamType = 'exam' | 'check'; // 考试课 / 考察课
export type CourseMode = 'online' | 'offline' | 'hybrid'; // 线上 / 线下 / 混合

export interface Course {
  id: string;
  name: string;
  teacher?: string;
  location?: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  startSection: number;
  endSection: number;
  color: string;
  weeks?: number[];
  examType?: ExamType; // 考核类型
  courseMode?: CourseMode; // 上课方式
  startWeek?: number; // 开始周
  endWeek?: number; // 结束周
  startTime?: string; // 具体开始时间，如 "08:30"
  endTime?: string; // 具体结束时间，如 "10:05"
}

export interface Semester {
  id: string;
  name: string; // 如 "2024-2025学年 第一学期"
  yearStart: number;
  yearEnd: number;
  term: 1 | 2; // 1=第一学期, 2=第二学期
  startDate: string; // 开学日期
  totalWeeks: number;
}

export interface User {
  id: string;
  name: string;
  createdAt: string;
}

export interface UserSchedule {
  courses: Course[];
  currentWeek: number;
  totalWeeks: number;
  semesterStart: string;
  currentSemesterId: string;
}

export interface Schedule {
  courses: Course[];
  currentWeek: number;
  totalWeeks: number;
  semesterStart: string;
}

export const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
export const DAY_NAMES_SHORT = ['一', '二', '三', '四', '五', '六', '日'] as const;

export const TIME_SLOTS = [
  '08:00', '08:50', '09:40', '10:30', '11:20',
  '12:10', '13:00', '13:50', '14:40', '15:30',
  '16:20', '17:10', '18:00', '18:50', '19:40',
  '20:30'
] as const;

// 默认节次时间（与 userStore.ts 中 DEFAULT_SECTION_TIMES 保持一致）
// 采用常见大学作息：45分钟一节课，课间5/10分钟休息
export const SECTION_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:15', end: '08:55' },
  2: { start: '09:00', end: '09:40' },
  3: { start: '09:50', end: '10:30' },
  4: { start: '10:40', end: '11:20' },
  5: { start: '11:25', end: '12:05' },
  6: { start: '13:30', end: '14:10' },
  7: { start: '14:15', end: '14:55' },
  8: { start: '15:00', end: '15:40' },
  9: { start: '15:45', end: '16:25' },
  10: { start: '18:30', end: '19:10' },
  11: { start: '19:15', end: '19:55' },
  12: { start: '20:00', end: '20:40' },
  13: { start: '08:15', end: '08:55' },
  14: { start: '09:00', end: '09:40' },
  15: { start: '09:50', end: '10:30' },
  16: { start: '10:40', end: '11:20' },
};

export const COURSE_COLORS = [
  '#0984E3', // 蓝色
  '#00B894', // 绿色
  '#E17055', // 橙色
  '#6C5CE7', // 紫色
  '#FDCB6E', // 黄色
  '#E84393', // 粉色
  '#00CEC9', // 青色
  '#D63031', // 红色
  '#74B9FF', // 浅蓝
  '#55A3FF', // 天蓝
];

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
