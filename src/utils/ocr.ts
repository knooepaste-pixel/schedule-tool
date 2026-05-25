import { Course } from '../types';
import { COURSE_COLORS, generateId } from './schedule';

// ============================================================
// 课表 OCR 文本解析器 — 支持多种教务系统课表格式
// ============================================================

const dayMap: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7, '天': 7,
};

// ──── 模式 1：教务系统标准格式 ──────────────────────────────
// "旅游规划与开发 (1-3节)1-4周/校区小和山/场地望院D311/教师黄瑾"
// "会计学原理 1-3节 1-4周 望院D317 杨莲芬"
// ────────────────────────────────────────────────────────────

function parseEduSystemFormat(text: string): Course[] {
  const courses: Course[] = [];
  const lines = text.split('\n').filter((l) => l.trim().length >= 3);

  for (const line of lines) {
    const trimmed = line.trim();
    // 跳过明显不是课程的行
    if (/^(学号|姓名|学期|周次|节次|上午|下午|晚上|总计|考查|考试|理论|实验|实践|第\d+节|课程安排|^\s*$)/i.test(trimmed)) {
      continue;
    }

    // 正则：提取 课程名 (X-Y节) X-Y周 /校区/场地/教师
    // 兼容多种格式变体：括号可缺、斜杠分隔可有空格、字段可省略
    const eduPattern = /^([\u4e00-\u9fa5（）()a-zA-Z0-9＋＇'·、_\-\s]{2,30}?)\s*[（(]?\s*(\d+)\s*[-~—到至]\s*(\d+)\s*节?\s*[)）]?\s*[（(]?\s*(\d+)\s*[-~—到至]\s*(\d+)\s*周?\s*[)）]?/;
    const eduMatch = trimmed.match(eduPattern);

    if (eduMatch) {
      const name = eduMatch[1].trim().replace(/^[：:，,。.\s]+/, '').replace(/[：:，,。.\s]+$/, '');
      if (name.length < 2) continue;

      const startSection = parseInt(eduMatch[2]);
      const endSection = parseInt(eduMatch[3]);
      const startWeek = parseInt(eduMatch[4]) || undefined;
      const endWeek = parseInt(eduMatch[5]) || undefined;

      // 提取地点和教师
      let location: string | undefined;
      let teacher: string | undefined;

      // 场地模式
      const locMatch = trimmed.match(/场地[：:]?\s*(\S+?)(?:[\/\s]|$)/);
      if (locMatch) location = locMatch[1].replace(/[，,。.\s]+$/, '');

      // 教师模式
      const teacherMatch = trimmed.match(/教师[：:]?\s*([\u4e00-\u9fa5a-zA-Z]{2,4})(?:[\/\s，,。.]|$)/);
      if (teacherMatch) teacher = teacherMatch[1];

      // 校区模式（作为后备地点）
      if (!location) {
        const campusMatch = trimmed.match(/校区[：:]?\s*(\S+?)(?:[\/\s]|$)/);
        if (campusMatch) location = campusMatch[1];
      }

      // 教室/楼 模式（后备）
      if (!location) {
        const roomMatch = trimmed.match(/([A-Z]?\d+[室号楼]|[A-Z]\d{2,4}|\S+院\S*|\S+楼\S*)/);
        if (roomMatch) location = roomMatch[1];
      }

      courses.push({
        id: generateId(),
        name,
        dayOfWeek: 1 as Course['dayOfWeek'], // 临时占位，后续修正
        startSection,
        endSection,
        location,
        teacher,
        color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
        startWeek,
        endWeek,
        // 标记来自教务系统格式，需要后续匹配星期
        ...({ rawLine: trimmed } as any),
      });
      continue;
    }

    // 检查是否有更简单的 "课程名 X-Y节" 格式（无周数、无地点、无教师）
    const simplePattern = /^([\u4e00-\u9fa5（）()a-zA-Z0-9＋＇'·、_\-\s]{2,25}?)\s*[（(]?\s*(\d+)\s*[-~—到至]\s*(\d+)\s*节?\s*[)）]?/;
    const simpleMatch = trimmed.match(simplePattern);
    if (simpleMatch) {
      const shortName = simpleMatch[1].trim().replace(/^[：:，,。.\s]+/, '').replace(/[：:，,。.\s]+$/, '');
      if (shortName.length < 2) continue;
      // 避免把 "第1节 08:15" 这类标题行当成课程
      if (/^\d|^第/.test(shortName)) continue;

      courses.push({
        id: generateId(),
        name: shortName,
        dayOfWeek: 1 as Course['dayOfWeek'],
        startSection: parseInt(simpleMatch[2]),
        endSection: parseInt(simpleMatch[3]),
        color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
        ...({ rawLine: trimmed } as any),
      });
    }
  }

  return courses;
}


// ──── 模式 2：传统文本格式 ──────────────────────────────────
// "旅游规划与开发 周一 第1-2节 望院D311"
// "会计学原理,周一,1-2节"
// ────────────────────────────────────────────────────────────

function parseTextFormat(text: string): Course[] {
  const courses: Course[] = [];
  const lines = text.split('\n').filter((l) => l.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3) continue;

    // 跳过无关行
    if (/^(学号|姓名|学期|周次|节次|上午|下午|晚上|总计|考查|考试|课程安排|^\s*$)/i.test(trimmed)) {
      continue;
    }

    let courseName = '';
    let dayOfWeek: number | null = null;
    let startSection = 1;
    let endSection = 1;
    let location: string | undefined;
    let teacher: string | undefined;
    let startWeek: number | undefined;
    let endWeek: number | undefined;

    // ── 提取星期 ──────────────────────────────────────────
    const dayPatterns = [
      /周\s*([一二三四五六日天])\s*(?:第|节|[（(])?/,          // 周一、周 一
      /星期\s*([一二三四五六日天])/,                           // 星期一
      /周\s*([1-7])\s*(?:第|节|[（(])?/,                     // 周1
    ];
    for (const p of dayPatterns) {
      const m = trimmed.match(p);
      if (m) {
        dayOfWeek = dayMap[m[1]] || parseInt(m[1]);
        break;
      }
    }

    // ── 提取节次 ──────────────────────────────────────────
    const sectionPatterns = [
      /第\s*(\d{1,2})\s*[-~—到至]\s*第?\s*(\d{1,2})\s*节/,
      /(\d{1,2})\s*[-~—到至]\s*(\d{1,2})\s*节/,
      /第\s*(\d{1,2})\s*节/,
    ];
    for (const p of sectionPatterns) {
      const m = trimmed.match(p);
      if (m) {
        if (m[2]) {
          startSection = parseInt(m[1]);
          endSection = parseInt(m[2]);
        } else {
          startSection = endSection = parseInt(m[1]);
        }
        break;
      }
    }

    // 如果还没找到，尝试 (X-Y节) 格式
    if (startSection === 1 && endSection === 1) {
      const bracketMatch = trimmed.match(/[（(]\s*(\d+)\s*[-~—到至]\s*(\d+)\s*节?\s*[)）]/);
      if (bracketMatch) {
        startSection = parseInt(bracketMatch[1]);
        endSection = parseInt(bracketMatch[2]);
      }
    }

    // ── 提取周次范围 ──────────────────────────────────────
    const weekRangeMatch = trimmed.match(/(\d+)\s*[-~—到至]\s*(\d+)\s*周/);
    if (weekRangeMatch) {
      startWeek = parseInt(weekRangeMatch[1]);
      endWeek = parseInt(weekRangeMatch[2]);
    }

    // ── 提取地点 ──────────────────────────────────────────
    const locPatterns = [
      /(?:场地|地点|教室)[：:]?\s*(\S+?)(?:[\/\s，,。.]|$)/,
      /(?:望院|博学楼|理学楼|教学楼|实验楼|机房|体育馆|操场|融汇|品院|弘文)[A-Z]?\d*[室]?/,
      /([A-Z]\d{2,4})/,
      /\S+院\s*[A-Z]?\d{3,6}[室]?/,
      /\S+楼\s*[A-Z]?\d{2,4}[室]?/,
    ];
    for (const p of locPatterns) {
      const m = trimmed.match(p);
      if (m) {
        location = (m[1] || m[0]).replace(/[\/\s，,。.]+$/, '');
        break;
      }
    }

    // ── 提取教师 ──────────────────────────────────────────
    const teacherMatch = trimmed.match(/教师[：:]?\s*([\u4e00-\u9fa5a-zA-Z]{2,4})/);
    if (teacherMatch) teacher = teacherMatch[1];

    // ── 提取课程名 ────────────────────────────────────────
    // 策略1：行首中文
    const nameFromStart = trimmed.match(/^([\u4e00-\u9fa5（）()a-zA-Z0-9＋＇'·、_\-\s]{2,25}?)(?=\s*[周\(\[（第]|\s*$|\s+\d)/);
    if (nameFromStart) {
      const name = nameFromStart[1].trim();
      if (
        name.length >= 2 &&
        !/^周|^节|^第|^上午|^下午|^晚上|^考核|^考试|^学号|^教师/.test(name)
      ) {
        courseName = name;
      }
    }

    // 策略2：移除已识别部分后的中文
    if (!courseName) {
      let cleaned = trimmed;
      cleaned = cleaned.replace(/周\s*[一二三四五六日天1-7]\s*(?:第|节|[（(])?.*?(?:$|(?=\s))/, '');
      cleaned = cleaned.replace(/第?\d+\s*[-~—到至]\s*第?\d+\s*节/g, '');
      cleaned = cleaned.replace(/地点[：:]\S+/g, '');
      cleaned = cleaned.replace(/教师[：:]\S+/g, '');
      cleaned = cleaned.replace(/\S+院\s*[A-Z]?\d+[室]?/g, '');
      cleaned = cleaned.replace(/\S+楼\s*[A-Z]?\d+[室]?/g, '');
      cleaned = cleaned.replace(/\d+[-~—到至]\d+\s*周/g, '');
      cleaned = cleaned.replace(/\s+/g, ' ').trim();

      if (cleaned.length >= 2 && cleaned.length <= 25 && /^[\u4e00-\u9fa5]/.test(cleaned)) {
        courseName = cleaned;
      }
    }

    // 验证并添加
    if (courseName && courseName.length >= 2 && dayOfWeek) {
      courseName = courseName.replace(/[，。、，,.\s]+$/, '').trim();
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

  return courses;
}


// ──── 模式 3：全局搜索 ────────────────────────────────────
// 最后的兜底方案：在整个文本中搜索所有课程模式
// ────────────────────────────────────────────────────────────

function parseGlobalPattern(text: string): Course[] {
  const courses: Course[] = [];

  // 教务系统格式全局搜索
  const eduGlobal = /([\u4e00-\u9fa5（）()a-zA-Z0-9＋＇'·、_\-\s]{2,25}?)\s*[（(]\s*(\d+)\s*[-~—到至]\s*(\d+)\s*节\s*[)）]\s*(\d+)\s*[-~—到至]\s*(\d+)\s*周/g;
  let match;
  while ((match = eduGlobal.exec(text)) !== null) {
    const name = match[1].trim();
    if (name.length < 2) continue;

    let location: string | undefined;
    let teacher: string | undefined;
    const contextAfter = text.substring(match.index, match.index + 150);

    const locM = contextAfter.match(/场地[：:]?\s*(\S+?)(?:[\/\s]|$)/);
    if (locM) location = locM[1];

    const teacherM = contextAfter.match(/教师[：:]?\s*([\u4e00-\u9fa5a-zA-Z]{2,4})/);
    if (teacherM) teacher = teacherM[1];

    courses.push({
      id: generateId(),
      name,
      dayOfWeek: 1 as Course['dayOfWeek'],
      startSection: parseInt(match[2]),
      endSection: parseInt(match[3]),
      location,
      teacher,
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
      startWeek: parseInt(match[4]),
      endWeek: parseInt(match[5]),
    });
  }

  // 如果找到了就不用再搜文本格式
  if (courses.length > 0) return courses;

  // 传统文本格式全局搜索
  const textGlobal = /([\u4e00-\u9fa5]{2,15})\s+周([一二三四五六日天])\s+第?(\d+)\s*[-~—到至]\s*第?(\d+)\s*[节课]/g;
  while ((match = textGlobal.exec(text)) !== null) {
    const locAfter = text.substring(match.index, match.index + 80);
    let location: string | undefined;
    const locM = locAfter.match(/(\S+院\S*|\S+楼\S*|\S+[室馆])/);
    if (locM) location = locM[1];

    courses.push({
      id: generateId(),
      name: match[1].trim(),
      dayOfWeek: dayMap[match[2]] as Course['dayOfWeek'],
      startSection: parseInt(match[3]),
      endSection: parseInt(match[4]),
      location,
      color: COURSE_COLORS[courses.length % COURSE_COLORS.length],
    });
  }

  return courses;
}


// ──── 星期智能推测 ────────────────────────────────────────
// 教务系统格式的课程没有直接的星期信息（星期在表头列中），
// 需要从 OCR 文本上下文推测
// ────────────────────────────────────────────────────────────

function inferDayOfWeek(
  courses: Course[],
  rawText: string,
): Course[] {
  // 尝试从文本中找星期列标题和课程的对应关系
  // 常见模式：OCR 可能输出类似 "周一 周二" 后面跟内容
  // 或者文本中穿插了星期标记

  const dayMarkers: { pattern: RegExp; day: number }[] = [
    { pattern: /星期\s*一|周一|W1|Mon/i, day: 1 },
    { pattern: /星期\s*二|周二|W2|Tue/i, day: 2 },
    { pattern: /星期\s*三|周三|W3|Wed/i, day: 3 },
    { pattern: /星期\s*四|周四|W4|Thu/i, day: 4 },
    { pattern: /星期\s*五|周五|W5|Fri/i, day: 5 },
    { pattern: /星期\s*六|周六|W6|Sat/i, day: 6 },
    { pattern: /星期\s*日|周日|W7|Sun/i, day: 7 },
  ];

  // 找到所有星期标记在文本中的位置
  const dayPositions: { day: number; pos: number }[] = [];
  for (const marker of dayMarkers) {
    const m = rawText.match(marker.pattern);
    if (m && m.index !== undefined) {
      dayPositions.push({ day: marker.day, pos: m.index });
    }
  }

  // 按位置排序
  dayPositions.sort((a, b) => a.pos - b.pos);

  // 如果找到了星期标记，尝试按位置分配
  if (dayPositions.length >= 5) {
    // 对于按行处理的 courses，看每门课在 rawText 中的位置
    // 用 rawLine 在文本中的位置确定它应该属于哪个星期
    for (const course of courses) {
      const rawLine = (course as any).rawLine as string | undefined;
      if (!rawLine) continue;

      const lineIdx = rawText.indexOf(rawLine);
      if (lineIdx < 0) continue;

      // 找到右边最近的星期标记
      let bestDay = 1;
      let bestDist = Infinity;
      for (const dp of dayPositions) {
        if (dp.pos <= lineIdx + 200) {
          const dist = Math.abs(lineIdx - dp.pos);
          if (dist < bestDist) {
            bestDist = dist;
            bestDay = dp.day;
          }
        }
      }
      course.dayOfWeek = bestDay as Course['dayOfWeek'];
      delete (course as any).rawLine;
    }
  }

  return courses;
}


// ──── 主解析入口 ──────────────────────────────────────────

export function parseCoursesFromOCRText(text: string): Course[] {
  if (!text || text.length < 10) return [];

  let courses: Course[] = [];

  // ── 第一优先级：教务系统格式 ──
  courses = parseEduSystemFormat(text);
  if (courses.length >= 3) {
    courses = inferDayOfWeek(courses, text);
    return deduplicateCourses(courses);
  }

  // ── 第二优先级：传统文本格式 ──
  const textCourses = parseTextFormat(text);
  courses = [...courses, ...textCourses];

  if (courses.length >= 2) {
    return deduplicateCourses(courses);
  }

  // ── 第三优先级：全局兜底搜索 ──
  const globalCourses = parseGlobalPattern(text);
  courses = [...courses, ...globalCourses];

  return deduplicateCourses(courses);
}


// ──── 去重 ──────────────────────────────────────────────────

function deduplicateCourses(courses: Course[]): Course[] {
  return courses.filter((course, index, self) =>
    index === self.findIndex((c) =>
      c.name === course.name &&
      c.dayOfWeek === course.dayOfWeek &&
      c.startSection === course.startSection &&
      c.endSection === course.endSection
    )
  );
}


// ──── 质量验证 ─────────────────────────────────────────────

export function validateOCRResult(
  courses: Course[],
): { valid: boolean; message: string } {
  if (courses.length === 0) {
    return { valid: false, message: '未能识别到课程信息' };
  }

  const hasValidNames = courses.filter((c) => c.name && c.name.length >= 2);
  if (hasValidNames.length < courses.length * 0.6) {
    return {
      valid: false,
      message: `课程名识别率低（${hasValidNames.length}/${courses.length}），建议用 AI 视觉识别或手动输入`,
    };
  }

  const hasSections = courses.filter(
    (c) => c.startSection > 0 && c.endSection > 0 && c.startSection !== c.endSection,
  );
  if (courses.length >= 3 && hasSections.length < courses.length * 0.3) {
    return {
      valid: false,
      message: `节次信息不完整，部分课程标记为单节课（可能识别错误）`,
    };
  }

  // 检查 dayOfWeek 是否全是默认值（说明星期没识别到）
  const allDayOne = courses.every((c) => c.dayOfWeek === 1);
  if (allDayOne && courses.length >= 3) {
    return {
      valid: false,
      message: `识别到 ${courses.length} 门课程，但星期信息缺失。请手动调整每门课的星期，或尝试用 AI 视觉识别`,
    };
  }

  return { valid: true, message: `成功识别 ${courses.length} 门课程` };
}


// ──── 获取解析详情（用于 debug 显示）──────────────────────

export function getParseDetails(text: string): {
  eduSystemCount: number;
  textFormatCount: number;
  globalCount: number;
} {
  const edu = parseEduSystemFormat(text);
  const txt = parseTextFormat(text);
  const global = parseGlobalPattern(text);
  return {
    eduSystemCount: edu.length,
    textFormatCount: txt.length,
    globalCount: global.length,
  };
}
