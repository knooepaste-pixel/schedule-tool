import { User, UserSchedule, Semester, Course } from '../types';
import { generateId } from '../types';

const USERS_KEY = 'schedule_users';
const CURRENT_USER_KEY = 'schedule_current_user';
const USER_SCHEDULE_PREFIX = 'user_schedule_';
const USER_SEMESTERS_PREFIX = 'user_semesters_';
const ACCOUNTS_KEY = 'schedule_accounts';
const ACCOUNT_USER_PREFIX = 'account_user_';

// 账户类型
interface Account {
  id: string;
  username: string;
  password: string;
  createdAt: string;
}

// 默认学期配置
const DEFAULT_SEMESTERS: Semester[] = [
  {
    id: generateId(),
    name: '2024-2025学年 第一学期',
    yearStart: 2024,
    yearEnd: 2025,
    term: 1,
    startDate: '2024-09-02',
    totalWeeks: 20,
  },
  {
    id: generateId(),
    name: '2024-2025学年 第二学期',
    yearStart: 2024,
    yearEnd: 2025,
    term: 2,
    startDate: '2025-02-24',
    totalWeeks: 18,
  },
];

// 默认课表配置
const DEFAULT_SCHEDULE: UserSchedule = {
  courses: [],
  currentWeek: 1,
  totalWeeks: 20,
  semesterStart: '2024-09-02',
  currentSemesterId: '',
};

// 获取所有用户
export function getAllUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  if (!data) {
    const defaultUser: User = {
      id: generateId(),
      name: '我的课表',
      createdAt: new Date().toISOString(),
    };
    saveUsers([defaultUser]);
    setCurrentUser(defaultUser.id);
    return [defaultUser];
  }
  return JSON.parse(data);
}

// 保存用户列表
function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// 获取当前用户ID
export function getCurrentUserId(): string {
  return localStorage.getItem(CURRENT_USER_KEY) || '';
}

// 设置当前用户
export function setCurrentUser(userId: string): void {
  localStorage.setItem(CURRENT_USER_KEY, userId);
}

// 获取当前用户
export function getCurrentUser(): User | null {
  const users = getAllUsers();
  const currentId = getCurrentUserId();
  return users.find((u) => u.id === currentId) || users[0] || null;
}

// 添加新用户
export function addUser(name: string): User {
  const users = getAllUsers();
  const newUser: User = {
    id: generateId(),
    name,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);

  // 为新用户创建默认学期和课表
  const semesters = DEFAULT_SEMESTERS.map((s) => ({
    ...s,
    id: generateId(),
  }));
  if (semesters.length > 0) {
    semesters[0].id = generateId(); // 重新生成第一个学期的ID
  }
  saveUserSemesters(newUser.id, semesters);

  const defaultSchedule = {
    ...DEFAULT_SCHEDULE,
    currentSemesterId: semesters[0]?.id || '',
  };
  saveUserSchedule(newUser.id, defaultSchedule);

  return newUser;
}

// 删除用户
export function deleteUser(userId: string): boolean {
  const users = getAllUsers();
  if (users.length <= 1) {
    return false; // 至少保留一个用户
  }

  const filteredUsers = users.filter((u) => u.id !== userId);
  saveUsers(filteredUsers);

  // 删除用户数据
  localStorage.removeItem(`${USER_SCHEDULE_PREFIX}${userId}`);
  localStorage.removeItem(`${USER_SEMESTERS_PREFIX}${userId}`);

  // 如果删除的是当前用户，切换到第一个用户
  if (getCurrentUserId() === userId) {
    setCurrentUser(filteredUsers[0].id);
  }

  return true;
}

// 获取用户课表
export function getUserSchedule(userId: string): UserSchedule {
  const data = localStorage.getItem(`${USER_SCHEDULE_PREFIX}${userId}`);
  if (!data) {
    // 初始化新用户的课表
    const semesters = getUserSemesters(userId);
    const defaultSchedule: UserSchedule = {
      ...DEFAULT_SCHEDULE,
      currentSemesterId: semesters[0]?.id || '',
    };
    saveUserSchedule(userId, defaultSchedule);
    return defaultSchedule;
  }
  return JSON.parse(data);
}

// 保存用户课表
export function saveUserSchedule(userId: string, schedule: UserSchedule): void {
  localStorage.setItem(`${USER_SCHEDULE_PREFIX}${userId}`, JSON.stringify(schedule));
}

// 获取用户学期列表
export function getUserSemesters(userId: string): Semester[] {
  const data = localStorage.getItem(`${USER_SEMESTERS_PREFIX}${userId}`);
  if (!data) {
    // 创建默认学期
    const semesters = DEFAULT_SEMESTERS.map((s) => ({
      ...s,
      id: generateId(),
    }));
    saveUserSemesters(userId, semesters);
    return semesters;
  }
  return JSON.parse(data);
}

// 保存用户学期列表
export function saveUserSemesters(userId: string, semesters: Semester[]): void {
  localStorage.setItem(`${USER_SEMESTERS_PREFIX}${userId}`, JSON.stringify(semesters));
}

// 添加学期
export function addSemester(userId: string, semester: Omit<Semester, 'id'>): Semester {
  const semesters = getUserSemesters(userId);
  const newSemester: Semester = {
    ...semester,
    id: generateId(),
  };
  semesters.push(newSemester);
  saveUserSemesters(userId, semesters);
  return newSemester;
}

// 更新学期
export function updateSemester(userId: string, semester: Semester): void {
  const semesters = getUserSemesters(userId);
  const index = semesters.findIndex((s) => s.id === semester.id);
  if (index !== -1) {
    semesters[index] = semester;
    saveUserSemesters(userId, semesters);
  }
}

// 删除学期
export function deleteSemester(userId: string, semesterId: string): void {
  const semesters = getUserSemesters(userId);
  const filtered = semesters.filter((s) => s.id !== semesterId);
  saveUserSemesters(userId, filtered);
}

// 导出用户数据
export function exportUserData(userId: string): string {
  const user = getAllUsers().find((u) => u.id === userId);
  const schedule = getUserSchedule(userId);
  const semesters = getUserSemesters(userId);

  return JSON.stringify({
    user,
    schedule,
    semesters,
    exportDate: new Date().toISOString(),
  }, null, 2);
}

// 导入用户数据
export function importUserData(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    if (!parsed.user || !parsed.schedule) {
      return false;
    }

    const users = getAllUsers();
    const newUserId = generateId();
    const newUser: User = {
      ...parsed.user,
      id: newUserId,
      name: `${parsed.user.name} (导入)`,
    };
    users.push(newUser);
    saveUsers(users);

    saveUserSchedule(newUserId, {
      ...parsed.schedule,
      currentSemesterId: parsed.schedule.currentSemesterId,
    });

    if (parsed.semesters) {
      const semesters = parsed.semesters.map((s: Semester) => ({
        ...s,
        id: generateId(),
      }));
      saveUserSemesters(newUserId, semesters);
    }

    return true;
  } catch {
    return false;
  }
}

// 计算当前周数
export function calculateCurrentWeek(semesterStart: string, totalWeeks: number = 20): number {
  const start = new Date(semesterStart);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(week, totalWeeks));
}

// 账户登录 - 返回关联的userId
export function loginWithAccount(accountId: string): User | null {
  // 获取账户信息
  const accounts = getStoredAccounts();
  const account = accounts.find(a => a.id === accountId);
  if (!account) return null;

  // 获取账户关联的用户
  const userId = localStorage.getItem(`${ACCOUNT_USER_PREFIX}${accountId}`);
  if (userId) {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user.id);
      return user;
    }
  }

  // 如果没有关联用户，创建一个
  const users = getAllUsers();
  let user = users.find(u => u.id === userId);

  if (!user) {
    user = {
      id: generateId(),
      name: account.username,
      createdAt: account.createdAt,
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(`${ACCOUNT_USER_PREFIX}${accountId}`, user.id);

    // 为新用户创建默认学期和课表
    const semesters = DEFAULT_SEMESTERS.map((s) => ({
      ...s,
      id: generateId(),
    }));
    saveUserSemesters(user.id, semesters);

    const defaultSchedule: UserSchedule = {
      ...DEFAULT_SCHEDULE,
      currentSemesterId: semesters[0]?.id || '',
    };
    saveUserSchedule(user.id, defaultSchedule);
  }

  setCurrentUser(user.id);
  return user;
}

// 验证账户密码
export function verifyAccount(username: string, password: string): Account | null {
  const accounts = getStoredAccounts();
  const account = accounts.find(a => a.username === username);
  if (!account) return null;

  const hashed = btoa(password + '_schedule_salt');
  if (hashed !== account.password) return null;

  return account;
}

// 注册新账户
export function registerAccount(username: string, password: string): Account | null {
  const accounts = getStoredAccounts();

  // 检查用户名是否已存在
  if (accounts.some(a => a.username === username)) {
    return null;
  }

  const newAccount: Account = {
    id: generateId(),
    username,
    password: btoa(password + '_schedule_salt'),
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

  // 立即创建关联用户
  loginWithAccount(newAccount.id);

  return newAccount;
}

// 获取存储的账户列表
function getStoredAccounts(): Account[] {
  const data = localStorage.getItem(ACCOUNTS_KEY);
  return data ? JSON.parse(data) : [];
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  return localStorage.getItem('schedule_logged_in') === 'true';
}

// 设置登录状态
export function setLoggedIn(accountId: string) {
  localStorage.setItem('schedule_logged_in', 'true');
  localStorage.setItem('schedule_current_account', accountId);
}

// 退出登录
export function logout() {
  localStorage.removeItem('schedule_logged_in');
  localStorage.removeItem('schedule_current_account');
  localStorage.removeItem(CURRENT_USER_KEY);
}

// 获取当前登录的账户ID
export function getCurrentAccountId(): string {
  return localStorage.getItem('schedule_current_account') || '';
}

// 简单密码哈希
export function hashPassword(pwd: string): string {
  return btoa(pwd + '_schedule_salt');
}

// 自定义时间配置相关
const CUSTOM_TIMES_KEY = 'schedule_custom_times';

// 默认节次时间（与 types/index.ts 中 SECTION_TIMES 保持一致）
// 采用常见大学作息：45分钟一节课，课间5/10分钟休息
export const DEFAULT_SECTION_TIMES: Record<number, { start: string; end: string }> = {
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

// 获取自定义时间配置
export function getCustomTimes(): Record<number, { start: string; end: string }> | null {
  const data = localStorage.getItem(CUSTOM_TIMES_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

// 保存自定义时间配置
export function saveCustomTimes(times: Record<number, { start: string; end: string }>): void {
  localStorage.setItem(CUSTOM_TIMES_KEY, JSON.stringify(times));
}
