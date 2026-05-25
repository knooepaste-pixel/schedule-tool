import { Course, Schedule } from '../types';
import { COURSE_COLORS, generateId } from '../types';

// ============================================================
// Bmob 云端存储模块
// ============================================================

const BM_APP_ID = '74cd7756104acc7ad3e3fa366a770dd7';
const BM_API_KEY = 'a9b9ae9c68e17878bd38511e2b2fdc69';
const BASE_URL = 'https://api2.bmob.cn/1';

// ── 通用请求 ────────────────────────────────────────────

async function bmobFetch(
  path: string,
  options: RequestInit = {},
  sessionToken?: string,
): Promise<any> {
  const headers: Record<string, string> = {
    'X-Bmob-Application-Id': BM_APP_ID,
    'X-Bmob-REST-API-Key': BM_API_KEY,
    'Content-Type': 'application/json',
  };
  if (sessionToken) {
    headers['X-Bmob-Session-Token'] = sessionToken;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...options.headers as any },
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error || data.code || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  return data;
}

// ── 账号注册 ────────────────────────────────────────────

export async function cloudRegister(
  username: string,
  password: string,
): Promise<{ userId: string; sessionToken: string }> {
  const data = await bmobFetch('/users', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return { userId: data.objectId, sessionToken: data.sessionToken };
}

// ── 账号登录 ────────────────────────────────────────────

export async function cloudLogin(
  username: string,
  password: string,
): Promise<{ userId: string; sessionToken: string; username: string }> {
  const data = await bmobFetch(
    `/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    { method: 'GET' },
  );
  return { userId: data.objectId, sessionToken: data.sessionToken, username: data.username };
}

// ── 加载课表 ────────────────────────────────────────────

export async function cloudLoadSchedule(
  userId: string,
  sessionToken: string,
): Promise<Schedule | null> {
  try {
    // 查询属于该用户的 Schedule 记录
    const where = JSON.stringify({ userId });
    const data = await bmobFetch(
      `/classes/Schedule?where=${encodeURIComponent(where)}`,
      { method: 'GET' },
      sessionToken,
    );

    if (data.results && data.results.length > 0) {
      const record = data.results[0];
      return {
        courses: record.courses || [],
        currentWeek: record.currentWeek || 1,
        totalWeeks: record.totalWeeks || 20,
        semesterStart: record.semesterStart || new Date().toISOString().split('T')[0],
      };
    }
    return null;
  } catch {
    return null; // 首次使用，没有数据正常
  }
}

// ── 保存课表 ────────────────────────────────────────────

export async function cloudSaveSchedule(
  userId: string,
  sessionToken: string,
  schedule: Schedule,
): Promise<void> {
  // 先查是否存在已有记录
  const where = JSON.stringify({ userId });
  const existing = await bmobFetch(
    `/classes/Schedule?where=${encodeURIComponent(where)}`,
    { method: 'GET' },
    sessionToken,
  );

  const body = {
    userId,
    courses: schedule.courses,
    currentWeek: schedule.currentWeek,
    totalWeeks: schedule.totalWeeks,
    semesterStart: schedule.semesterStart,
  };

  if (existing.results && existing.results.length > 0) {
    // 更新已有记录
    const recordId = existing.results[0].objectId;
    await bmobFetch(
      `/classes/Schedule/${recordId}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      sessionToken,
    );
  } else {
    // 新建记录
    await bmobFetch(
      '/classes/Schedule',
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      sessionToken,
    );
  }
}

// ── 云端会话持久化 ──────────────────────────────────────

const SESSION_KEY = 'cloud_session';

export function saveCloudSession(data: { userId: string; sessionToken: string; username: string }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function loadCloudSession(): { userId: string; sessionToken: string; username: string } | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearCloudSession() {
  localStorage.removeItem(SESSION_KEY);
}
