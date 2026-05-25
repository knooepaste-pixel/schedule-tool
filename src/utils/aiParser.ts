import { Course } from '../types';
import { COURSE_COLORS, generateId } from '../types';

// ============================================================
// AI Agent 核心 — 支持 DeepSeek V4 Pro / GPT-4o 等高级模型
// ============================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface VisionMessage {
  role: 'system' | 'user';
  content: string | VisionContent[];
}

interface VisionContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string; detail?: 'low' | 'high' | 'auto' };
}

// ── API 配置 ──────────────────────────────────────────────

const API_ENDPOINTS: Record<string, string> = {
  deepseek: 'https://api.deepseek.com/chat/completions',
  deepseek_v4: 'https://api.deepseek.com/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  gpt4o: 'https://api.openai.com/v1/chat/completions',
  qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
};

const API_MODELS: Record<string, string> = {
  deepseek: 'deepseek-chat',
  deepseek_v4: 'deepseek-v4-pro',
  openai: 'gpt-4o-mini',
  gpt4o: 'gpt-4o',
  qwen: 'qwen-plus',
};

export const MODEL_OPTIONS = [
  { value: 'deepseek_v4', label: 'DeepSeek V4 Pro（推荐）', endpoint: 'deepseek' },
  { value: 'deepseek', label: 'DeepSeek V3', endpoint: 'deepseek' },
  { value: 'gpt4o', label: 'GPT-4o（最强）', endpoint: 'openai' },
  { value: 'openai', label: 'GPT-4o-mini', endpoint: 'openai' },
  { value: 'qwen', label: '通义千问', endpoint: 'qwen' },
];

export type ApiType = 'deepseek' | 'deepseek_v4' | 'openai' | 'gpt4o' | 'qwen';

// ── 通用聊天 ──────────────────────────────────────────────

export async function chatWithAI(
  messages: ChatMessage[],
  apiKey: string,
  apiType: ApiType,
): Promise<string> {
  const endpoint = API_ENDPOINTS[apiType];
  const model = API_MODELS[apiType];
  if (!endpoint) throw new Error(`不支持的 API 类型: ${apiType}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('网络请求失败');
    }
    throw error;
  }
}

// ── Agent 工具系统 ────────────────────────────────────────

// 工具定义（发给 AI 的）
export const AGENT_TOOLS = `
## 你可以调用的工具

当你需要操作课表时，在回复中用以下格式调用工具：

### ADD_COURSE
添加一门课程。
\`\`\`tool:ADD_COURSE
名称: [课程名]
星期: [1-7，1=周一]
节次: [开始节]-[结束节]
地点: [教室，可选]
教师: [教师名，可选]
开始周: [数字，可选，默认1]
结束周: [数字，可选，默认16]
\`\`\`

### DELETE_COURSE
删除课程。
\`\`\`tool:DELETE_COURSE
课程名: [要删除的课程名]
\`\`\`

### UPDATE_COURSE
修改课程信息。
\`\`\`tool:UPDATE_COURSE
原课程名: [旧名称]
新名称: [新名称，可选]
星期: [1-7，可选]
节次: [开始]-[结束，可选]
地点: [教室，可选]
教师: [教师名，可选]
\`\`\`

### CLEAR_ALL
清空所有课程。
\`\`\`tool:CLEAR_ALL
确认: yes
\`\`\`

### BATCH_ADD
批量添加多门课程。
\`\`\`tool:BATCH_ADD
[
  {"名称":"课程1","星期":1,"节次":"1-2","地点":"教室A"},
  {"名称":"课程2","星期":3,"节次":"3-4","地点":"教室B"}
]
\`\`\`

### 规则
- 一个回复可以包含多个工具调用
- 工具调用放在代码块中
- 该聊天时聊天，该动手时动手
`;

// ── Agent 系统 Prompt ─────────────────────────────────────

export function buildAgentPrompt(courses: Course[]): string {
  const weekNames = ['一', '二', '三', '四', '五', '六', '日'];

  const courseSummary = courses.length === 0
    ? '当前课表为空。'
    : `当前课表（${courses.length} 门课）：\n` + courses.map(c =>
        `• ${c.name} | 周${weekNames[c.dayOfWeek - 1]} | 第${c.startSection}-${c.endSection}节` +
        `${c.location ? ` | ${c.location}` : ''}` +
        `${c.teacher ? ` | ${c.teacher}` : ''}` +
        `${c.startWeek ? ` | ${c.startWeek}-${c.endWeek}周` : ''}`
      ).join('\n');

  const daySummary = [1,2,3,4,5,6,7].map(d => {
    const dayCourses = courses.filter(c => c.dayOfWeek === d);
    return dayCourses.length > 0
      ? `周${weekNames[d-1]}：${dayCourses.length}门课（${dayCourses.map(c => c.name).join('、')}）`
      : `周${weekNames[d-1]}：无课`;
  }).join('\n');

  return `## 你的身份
你是「课表管家」，一个聪明的 AI 助手。你住在这个课表 App 里，能直接操作用户的课表数据。

你不是只能聊天的机器人——你可以真正动手帮用户管理课表。

## 你的能力
1. **查看分析**：随时了解用户的完整课表
2. **增删改查**：添加、删除、修改课程
3. **冲突检测**：发现时间冲突并提醒
4. **智能建议**：分析课表给出优化建议
5. **总结汇报**：按天/周总结课程安排
6. **数据填充**：用户给你信息，你自动填进去

## 当前课表数据

${courseSummary}

## 每日概况

${daySummary}

## 行为准则
- 主动！看到问题直接说，比如「周一上午3节课连上，中午没时间吃饭了」
- 精准！改数据前确认，不确定就问
- 有用！别废话，直接给结论
- 友好！像同学一样聊天，别冷冰冰

${AGENT_TOOLS}`;
}

// ── 工具解析器 ────────────────────────────────────────────

export interface ToolCall {
  type: 'ADD_COURSE' | 'DELETE_COURSE' | 'UPDATE_COURSE' | 'CLEAR_ALL' | 'BATCH_ADD';
  data: Record<string, any>;
}

export function parseToolCalls(response: string): ToolCall[] {
  const calls: ToolCall[] = [];

  // 匹配工具块
  const toolRegex = /```tool:(\w+)\s*\n([\s\S]*?)```/g;
  let match;

  while ((match = toolRegex.exec(response)) !== null) {
    const type = match[1] as ToolCall['type'];
    const body = match[2].trim();

    if (type === 'BATCH_ADD') {
      try {
        const json = JSON.parse(body);
        calls.push({ type, data: { courses: json } });
      } catch {
        // JSON 解析失败
      }
    } else if (type === 'CLEAR_ALL') {
      calls.push({ type, data: {} });
    } else {
      const data: Record<string, any> = {};
      for (const line of body.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.substring(0, colonIdx).trim();
          const val = line.substring(colonIdx + 1).trim();
          data[key] = val;
        }
      }
      calls.push({ type, data });
    }
  }

  return calls;
}

// ── 工具执行器 ────────────────────────────────────────────

const WEEK_DAY_MAP: Record<string, number> = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7,
};

function parseDay(val: any): number {
  if (typeof val === 'number') return Math.min(7, Math.max(1, val));
  const str = String(val);
  if (WEEK_DAY_MAP[str]) return WEEK_DAY_MAP[str];
  const match = str.match(/周?([一二三四五六日])/);
  if (match) return WEEK_DAY_MAP[match[1]] || 1;
  const num = parseInt(str);
  return num >= 1 && num <= 7 ? num : 1;
}

function parseSections(val: any): { start: number; end: number } {
  const str = String(val);
  const range = str.match(/(\d+)\s*[-~—到至]\s*(\d+)/);
  if (range) return { start: parseInt(range[1]), end: parseInt(range[2]) };
  const single = parseInt(str);
  return { start: single || 1, end: single || 1 };
}

export interface ToolResult {
  type: string;
  success: boolean;
  message: string;
  courses?: Course[];
}

export function executeToolCall(
  call: ToolCall,
  existingCourses: Course[],
  context: {
    addCourse: (c: Course) => void;
    updateCourse: (c: Course) => void;
    deleteCourse: (id: string) => void;
    importCourses: (cs: Course[]) => void;
    clearAllCourses: () => void;
  },
): ToolResult {
  switch (call.type) {
    case 'ADD_COURSE': {
      const data = call.data;
      const name = data['名称'] || data['课程名'] || data['name'];
      if (!name) return { type: 'ADD_COURSE', success: false, message: '缺少课程名' };

      const day = parseDay(data['星期'] || data['day'] || 1);
      const sections = parseSections(data['节次'] || data['sections'] || '1-1');
      const location = data['地点'] || data['location'] || undefined;
      const teacher = data['教师'] || data['teacher'] || undefined;
      const startWeek = parseInt(data['开始周'] || data['startWeek']) || undefined;
      const endWeek = parseInt(data['结束周'] || data['endWeek']) || undefined;

      const course: Course = {
        id: generateId(),
        name,
        dayOfWeek: day as Course['dayOfWeek'],
        startSection: sections.start,
        endSection: sections.end,
        location,
        teacher,
        color: COURSE_COLORS[existingCourses.length % COURSE_COLORS.length],
        startWeek,
        endWeek,
      };

      context.addCourse(course);
      return { type: 'ADD_COURSE', success: true, message: `已添加：${name}`, courses: [course] };
    }

    case 'DELETE_COURSE': {
      const name = call.data['课程名'] || call.data['name'] || '';
      const course = existingCourses.find(c => c.name.includes(name) || name.includes(c.name));
      if (!course) return { type: 'DELETE_COURSE', success: false, message: `未找到课程：${name}` };
      context.deleteCourse(course.id);
      return { type: 'DELETE_COURSE', success: true, message: `已删除：${course.name}` };
    }

    case 'UPDATE_COURSE': {
      const oldName = call.data['原课程名'] || call.data['oldName'] || '';
      const course = existingCourses.find(c => c.name.includes(oldName) || oldName.includes(c.name));
      if (!course) return { type: 'UPDATE_COURSE', success: false, message: `未找到：${oldName}` };

      const updated = { ...course };
      if (call.data['新名称'] || call.data['newName']) updated.name = call.data['新名称'] || call.data['newName'];
      if (call.data['星期'] || call.data['day']) updated.dayOfWeek = parseDay(call.data['星期'] || call.data['day']) as Course['dayOfWeek'];
      if (call.data['节次'] || call.data['sections']) {
        const s = parseSections(call.data['节次'] || call.data['sections']);
        updated.startSection = s.start;
        updated.endSection = s.end;
      }
      if (call.data['地点'] || call.data['location']) updated.location = call.data['地点'] || call.data['location'];
      if (call.data['教师'] || call.data['teacher']) updated.teacher = call.data['教师'] || call.data['teacher'];

      context.updateCourse(updated);
      return { type: 'UPDATE_COURSE', success: true, message: `已更新：${updated.name}` };
    }

    case 'CLEAR_ALL': {
      context.clearAllCourses();
      return { type: 'CLEAR_ALL', success: true, message: '课表已清空' };
    }

    case 'BATCH_ADD': {
      const courses = call.data.courses || [];
      const newCourses: Course[] = [];
      for (const item of courses) {
        const day = parseDay(item['星期'] || item['day'] || 1);
        const sections = parseSections(item['节次'] || item['sections'] || '1-1');
        newCourses.push({
          id: generateId(),
          name: item['名称'] || item['name'],
          dayOfWeek: day as Course['dayOfWeek'],
          startSection: sections.start,
          endSection: sections.end,
          location: item['地点'] || item['location'],
          teacher: item['教师'] || item['teacher'],
          color: COURSE_COLORS[(existingCourses.length + newCourses.length) % COURSE_COLORS.length],
        });
      }
      context.importCourses(newCourses);
      return { type: 'BATCH_ADD', success: true, message: `批量添加 ${newCourses.length} 门课程`, courses: newCourses };
    }

    default:
      return { type: 'unknown', success: false, message: '未知工具' };
  }
}

// ── 保留旧接口兼容 ────────────────────────────────────────

export async function parseWithAI(
  text: string,
  apiKey: string,
  apiType: ApiType,
): Promise<Course[]> {
  const prompt = `请从以下文本提取课程信息，返回JSON数组。每项：name,dayOfWeek(1-7),startSection,endSection,location,teacher,startWeek,endWeek。只返回JSON：\n\n${text}`;
  try {
    const response = await chatWithAI(
      [
        { role: 'system', content: '你提取课表信息。只返回JSON数组，不要解释。' },
        { role: 'user', content: prompt },
      ],
      apiKey,
      apiType,
    );
    return extractCoursesFromJSON(response, 0);
  } catch {
    return [];
  }
}

export async function chatWithVisionAI(
  apiKey: string,
  imageBase64: string,
  apiType: ApiType,
  userPrompt?: string,
): Promise<string> {
  if (apiType === 'deepseek' || apiType === 'deepseek_v4') {
    throw new Error('DeepSeek 不支持图片识别，请使用 GPT-4o 或通义千问');
  }

  const model = API_MODELS[apiType];
  const endpoint = API_ENDPOINTS[apiType];

  const body = JSON.stringify({
    model,
    messages: [
      {
        role: 'system',
        content: '你识别课表图片，提取所有课程。返回JSON数组。字段：name,dayOfWeek(1-7),startSection,endSection,location,teacher,startWeek,endWeek。',
      },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageBase64, detail: 'high' } },
          { type: 'text', text: userPrompt || '提取课表' },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function parseFromImage(
  imageBase64: string,
  apiKey: string,
  apiType: ApiType,
): Promise<Course[]> {
  const response = await chatWithVisionAI(apiKey, imageBase64, apiType);
  return extractCoursesFromJSON(response, 0);
}

export function extractCoursesFromJSON(
  aiResponse: string,
  startIndex: number = 0,
): Course[] {
  if (!aiResponse) return [];

  let parsed: any[] = [];
  const arrayMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try { parsed = JSON.parse(arrayMatch[0]); } catch {}
  }
  if (parsed.length === 0) {
    const blockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (blockMatch) {
      try { parsed = JSON.parse(blockMatch[1]); } catch {}
    }
  }
  if (parsed.length === 0) {
    const objs = aiResponse.match(/\{[\s\S]*?\}/g);
    if (objs) {
      for (const o of objs) {
        try { parsed.push(JSON.parse(o)); } catch {}
      }
    }
  }
  if (parsed.length === 0) return [];

  return parsed.map((item: any, index: number) => ({
    id: generateId(),
    name: String(item.name || item.courseName || item['课程名'] || `课程${index + 1}`).trim(),
    dayOfWeek: parseDayField(item.dayOfWeek ?? item.weekday ?? item['星期'] ?? 1) as Course['dayOfWeek'],
    startSection: Math.min(16, Math.max(1, parseInt(item.startSection ?? item.start ?? 1) || 1)),
    endSection: Math.min(16, Math.max(1, parseInt(item.endSection ?? item.end ?? item.startSection ?? 1) || 1)),
    location: (item.location || item.place || item['地点']) ? String(item.location || item.place || item['地点']).trim() : undefined,
    teacher: (item.teacher || item['教师']) ? String(item.teacher || item['教师']).trim() : undefined,
    color: COURSE_COLORS[(startIndex + index) % COURSE_COLORS.length],
    startWeek: parseInt(item.startWeek ?? item.fromWeek) || undefined,
    endWeek: parseInt(item.endWeek ?? item.toWeek) || undefined,
  }));
}

function parseDayField(value: any): number {
  if (typeof value === 'number') return Math.min(7, Math.max(1, Math.round(value)));
  if (typeof value === 'string') {
    const zh: Record<string, number> = { '一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7 };
    for (const [k, v] of Object.entries(zh)) if (value.includes(k)) return v;
    const n = parseInt(value);
    if (n >= 1 && n <= 7) return n;
  }
  return 1;
}

// ── 配置管理 ──────────────────────────────────────────────

export function saveAIConfig(config: { apiType: string; apiKey: string }) {
  localStorage.setItem('ai_schedule_config', JSON.stringify(config));
}

export function getAIConfig(): { apiType: string; apiKey: string } | null {
  try {
    const saved = localStorage.getItem('ai_schedule_config');
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
}
