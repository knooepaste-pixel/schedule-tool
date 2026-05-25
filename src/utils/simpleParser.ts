import { Course } from '../types';
import { COURSE_COLORS, generateId } from './schedule';

// ============================================================
// 简化格式解析器 — 支持自然语言输入
// ============================================================

const dayMap: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6, '周日': 7,
  '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5, '星期六': 6, '星期日': 7,
};

export function parseSimpleFormat(text: string): Course[] {
  const courses: Course[] = [];
  const lines = text.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 3) continue;

    // 跳过标题行
    if (/^(课程|时间|星期|节次|教师|地点|备注|---|===|^\s*$)/i.test(trimmed)) continue;

    let courseName = '';
    let dayOfWeek: number | null = null;
    let startSection = 1;
    let endSection = 1;
    let location: string | undefined;
    let teacher: string | undefined;
    let startWeek: number | undefined;
    let endWeek: number | undefined;

    // ── 策略1：空格分隔 ──────────────────────────────────
    // "高等数学 周一 1-2节 教学楼A101 张教授"
    const spaceParts = trimmed.split(/\s+/);
    if (spaceParts.length >= 2) {
      for (const part of spaceParts) {
        // 星期
        for (const [key, val] of Object.entries(dayMap)) {
          if (part === key || part.startsWith(key)) {
            dayOfWeek = val;
            break;
          }
        }
        if (dayOfWeek) break;
      }

      // 节次
      for (const part of spaceParts) {
        const sectionMatch = part.match(/^(\d+)\s*[-~—到至]\s*(\d+)\s*节?$/);
        if (sectionMatch) {
          startSection = parseInt(sectionMatch[1]);
          endSection = parseInt(sectionMatch[2]);
          break;
        }
      }

      // 周次
      for (const part of spaceParts) {
        const weekMatch = part.match(/^(\d+)\s*[-~—到至]\s*(\d+)\s*周$/);
        if (weekMatch) {
          startWeek = parseInt(weekMatch[1]);
          endWeek = parseInt(weekMatch[2]);
          break;
        }
      }

      // 地点
      for (const part of spaceParts) {
        if (/^(教学楼|实验楼|机房|体育馆|操场|博学楼|理学楼|望院|融汇|品院|弘文|[A-Z]\d{2,}|\S+楼|\S+室|\S+馆|\S+厅)/.test(part)) {
          location = part;
          break;
        }
      }

      // 教师
      for (const part of spaceParts) {
        if (/^[\u4e00-\u9fa5]{2,4}$/.test(part) && part !== location) {
          // 排除已识别的地点
          if (!/楼|室|馆|院|厅|场/.test(part)) {
            teacher = part;
            break;
          }
        }
      }

      // 课程名（第一个非结构化的部分）
      for (const part of spaceParts) {
        if (
          part.length >= 2 &&
          part.length < 30 &&
          !dayMap[part] &&
          !part.match(/^\d+[-~—到至]\d+/) &&
          !/^(教学楼|实验楼|机房|体育|博学|理学|望院|融汇|品院|弘文)/.test(part) &&
          !/^[\u4e00-\u9fa5]{2,4}$/.test(part.replace(/[A-Za-z0-9（）() ]/g, ''))
        ) {
          // 可能是长课程名
          if (!/楼$|室$|馆$|院$/.test(part) && !/^\d/.test(part)) {
            courseName = part;
            break;
          }
        }
      }

      // 如果还没找到课程名，取第一个非空格非结构化的部分
      if (!courseName) {
        for (const part of spaceParts) {
          if (
            !dayMap[part] &&
            !part.match(/^\d+[-~—到至]/) &&
            !/楼$|室$|馆$|院$/.test(part) &&
            part.length >= 2
          ) {
            courseName = part;
            break;
          }
        }
      }
    }

    // ── 策略2：逗号/顿号分隔 ──────────────────────────────
    if (!dayOfWeek || !courseName) {
      const commaParts = trimmed.split(/[，,、\t]+/).map((p) => p.trim()).filter(Boolean);
      if (commaParts.length >= 2) {
        let tempName = courseName;
        let tempDay: number | null = dayOfWeek;

        for (const part of commaParts) {
          // 星期
          if (!tempDay) {
            for (const [key, val] of Object.entries(dayMap)) {
              if (part === key || part.includes(key)) {
                tempDay = val;
                break;
              }
            }
          }

          // 节次
          if (startSection === 1 && endSection === 1) {
            const sm = part.match(/(\d+)\s*[-~—到至]\s*(\d+)\s*节?/);
            if (sm) {
              startSection = parseInt(sm[1]);
              endSection = parseInt(sm[2]);
              continue;
            }
          }

          // 地点
          if (!location) {
            if (/楼$|室$|馆$|院$|场$|^(望院|融汇|品院|弘文|博学|理学)/.test(part)) {
              location = part;
              continue;
            }
          }

          // 教师
          if (!teacher && /^[\u4e00-\u9fa5]{2,4}$/.test(part) && !/楼|室|馆|院|场/.test(part)) {
            teacher = part;
            continue;
          }

          // 课程名
          if (!tempName && part.length >= 2 && part.length < 30) {
            tempName = part;
          }
        }

        courseName = tempName || courseName;
        dayOfWeek = tempDay || dayOfWeek;
      }
    }

    // ── 策略3：整行搜索 ──────────────────────────────────
    if (!dayOfWeek) {
      const dayMatch = trimmed.match(/周\s*([一二三四五六日天1-7])/);
      if (dayMatch) dayOfWeek = dayMap[dayMatch[1]] || parseInt(dayMatch[1]);
    }

    if (startSection === 1 && endSection === 1) {
      const secMatch = trimmed.match(/(\d+)\s*[-~—到至]\s*(\d+)\s*节/);
      if (secMatch) {
        startSection = parseInt(secMatch[1]);
        endSection = parseInt(secMatch[2]);
      } else {
        const singleMatch = trimmed.match(/第?\s*(\d+)\s*节/);
        if (singleMatch) startSection = endSection = parseInt(singleMatch[1]);
      }
    }

    if (!location) {
      const locMatch = trimmed.match(/(\S+[楼室馆院场厅]\S*)/);
      if (locMatch) location = locMatch[1];
    }

    if (!teacher) {
      const teacherMatch = trimmed.match(/教师[：:]?\s*([\u4e00-\u9fa5]{2,4})/);
      if (teacherMatch) teacher = teacherMatch[1];
    }

    if (!courseName) {
      // 取第一个看起来像课程名的部分
      const nameMatch = trimmed.match(/^([\u4e00-\u9fa5（）()a-zA-Z0-9＋·、_\s]{2,20})/);
      if (nameMatch && nameMatch[1].trim().length >= 2) {
        courseName = nameMatch[1].trim();
      }
    }

    // ── 验证并添加 ──────────────────────────────────────
    if (courseName && courseName.length >= 2 && dayOfWeek) {
      courseName = courseName.replace(/[，。、，,\s]+$/, '').trim();
      courses.push({
        id: generateId(),
        name: courseName,
        dayOfWeek: dayOfWeek as Course['dayOfWeek'],
        startSection,
        endSection,
        location,
        teacher,
        color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
        startWeek,
        endWeek,
      });
    }
  }

  // ── 去重 ──────────────────────────────────────────────
  return courses.filter(
    (course, index, self) =>
      index ===
      self.findIndex(
        (c) =>
          c.name === course.name &&
          c.dayOfWeek === course.dayOfWeek &&
          c.startSection === course.startSection,
      ),
  );
}


// ──── 示例数据 ────────────────────────────────────────────

export const SAMPLE_COURSES = [
  { name: '旅游规划与开发', dayOfWeek: 1, startSection: 1, endSection: 3, location: '望院D311', teacher: '黄瑾', startWeek: 1, endWeek: 4 },
  { name: '会计学原理', dayOfWeek: 3, startSection: 1, endSection: 3, location: '望院D317', teacher: '杨莲芬', startWeek: 1, endWeek: 4 },
  { name: '研学旅行项目设计', dayOfWeek: 1, startSection: 3, endSection: 5, location: '望院D410', teacher: '乔桂强', startWeek: 1, endWeek: 6 },
  { name: '全球治理英语（一）', dayOfWeek: 4, startSection: 4, endSection: 5, location: '望院C102', teacher: '谭玉梅', startWeek: 1, endWeek: 4 },
  { name: '马克思主义基本原理', dayOfWeek: 1, startSection: 6, endSection: 8, location: '望院D402', teacher: '应舒悦' },
  { name: '四史教育', dayOfWeek: 3, startSection: 6, endSection: 7, location: '望院D410', teacher: '程丛杰' },
];
