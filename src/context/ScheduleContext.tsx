import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Schedule, Course, Semester, UserSchedule } from '../types';
import {
  getCurrentUserId,
  getUserSchedule,
  saveUserSchedule,
  getUserSemesters,
  getAllUsers,
  setCurrentUser,
  calculateCurrentWeek,
  updateSemester as updateSemesterInStore,
  getCustomTimes,
  saveCustomTimes,
  DEFAULT_SECTION_TIMES,
} from '../utils/userStore';
import {
  cloudLoadSchedule,
  cloudSaveSchedule,
} from '../utils/cloudStore';

interface ScheduleContextType {
  schedule: Schedule;
  semesters: Semester[];
  currentSemesterId: string;
  addCourse: (course: Course) => void;
  updateCourse: (updatedCourse: Course) => void;
  deleteCourse: (courseId: string) => void;
  importCourses: (courses: Course[]) => void;
  clearAllCourses: () => void;
  setCurrentWeek: (week: number) => void;
  switchSemester: (semesterId: string) => void;
  updateSemester: (semester: Semester) => void;
  reloadForCurrentUser: () => void;
  customTimes: Record<number, { start: string; end: string }>;
  setCustomTimes: (times: Record<number, { start: string; end: string }>) => void;
  // 云端相关
  cloudUserId: string | null;
  cloudSessionToken: string | null;
  setCloudAuth: (userId: string, sessionToken: string) => void;
}

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  // ── 云端认证状态 ────────────────────────────────────
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudSessionToken, setCloudSessionToken] = useState<string | null>(null);

  const setCloudAuth = useCallback((userId: string, sessionToken: string) => {
    setCloudUserId(userId);
    setCloudSessionToken(sessionToken);
  }, []);

  // ── 本地课表初始化 ──────────────────────────────────
  const [schedule, setSchedule] = useState<Schedule>(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      const users = getAllUsers();
      if (users.length > 0) {
        setCurrentUser(users[0].id);
        const userSchedule = getUserSchedule(users[0].id);
        return {
          courses: userSchedule.courses,
          currentWeek: userSchedule.currentWeek,
          totalWeeks: userSchedule.totalWeeks,
          semesterStart: userSchedule.semesterStart,
        };
      }
    }
    const userSchedule = getUserSchedule(userId);
    const semesters = getUserSemesters(userId);
    const currentSemester = semesters.find(s => s.id === userSchedule.currentSemesterId) || semesters[0];

    let currentWeek = userSchedule.currentWeek;
    if (currentSemester) {
      const calculatedWeek = calculateCurrentWeek(currentSemester.startDate, currentSemester.totalWeeks);
      const today = new Date();
      const semesterStart = new Date(currentSemester.startDate);
      const daysSinceStart = Math.floor((today.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceStart >= 0 && daysSinceStart <= 7) {
        currentWeek = calculatedWeek;
      }
    }

    return {
      courses: userSchedule.courses,
      currentWeek,
      totalWeeks: currentSemester?.totalWeeks || userSchedule.totalWeeks,
      semesterStart: currentSemester?.startDate || userSchedule.semesterStart,
    };
  });

  // ── 从云端加载课表（登录成功后自动触发）─────────────
  const loadFromCloud = useCallback(async (userId: string, token: string) => {
    try {
      const cloudSchedule = await cloudLoadSchedule(userId, token);
      if (cloudSchedule && cloudSchedule.courses.length > 0) {
        setSchedule(cloudSchedule);
        // 同时存一份到本地（离线也能用）
        const userId_ = getCurrentUserId();
        if (userId_) {
          saveUserSchedule(userId_, {
            ...cloudSchedule,
            currentSemesterId,
          });
        }
      }
    } catch {
      // 云端加载失败，继续用本地数据
    }
  }, [currentSemesterId]);

  // 当云端认证变更时，自动拉取云端数据
  useEffect(() => {
    if (cloudUserId && cloudSessionToken) {
      loadFromCloud(cloudUserId, cloudSessionToken);
    }
  }, [cloudUserId, cloudSessionToken, loadFromCloud]);

  const [semesters, setSemesters] = useState<Semester[]>(() => {
    const userId = getCurrentUserId();
    return getUserSemesters(userId);
  });

  const [currentSemesterId, setCurrentSemesterId] = useState<string>(() => {
    const userId = getCurrentUserId();
    const userSchedule = getUserSchedule(userId);
    return userSchedule.currentSemesterId;
  });

  // 自定义时间配置状态
  const [customTimes, setCustomTimesState] = useState<Record<number, { start: string; end: string }>>(() => {
    const saved = getCustomTimes();
    return saved || DEFAULT_SECTION_TIMES;
  });

  const setCustomTimes = useCallback((times: Record<number, { start: string; end: string }>) => {
    saveCustomTimes(times);
    setCustomTimesState(times);
  }, []);

  // ── 保存数据（本地 + 云端）─────────────────────────
  const saveData = useCallback((newSchedule: Schedule) => {
    // 本地存储
    const userId = getCurrentUserId();
    if (userId) {
      const userSchedule: UserSchedule = {
        ...newSchedule,
        currentSemesterId,
      };
      saveUserSchedule(userId, userSchedule);
    }
    // 云端同步
    if (cloudUserId && cloudSessionToken) {
      cloudSaveSchedule(cloudUserId, cloudSessionToken, newSchedule).catch(() => {
        // 云端保存失败静默，下次修改会重试
      });
    }
  }, [currentSemesterId, cloudUserId, cloudSessionToken]);

  const reloadForCurrentUser = useCallback(() => {
    const userId = getCurrentUserId();
    const userSchedule = getUserSchedule(userId);
    const userSemesters = getUserSemesters(userId);

    setSemesters(userSemesters);

    const currentSemester = userSemesters.find(s => s.id === userSchedule.currentSemesterId) || userSemesters[0];
    if (currentSemester) {
      const calculatedWeek = calculateCurrentWeek(currentSemester.startDate, currentSemester.totalWeeks);
      setCurrentSemesterId(currentSemester.id);

      setSchedule({
        courses: userSchedule.courses,
        currentWeek: calculatedWeek,
        totalWeeks: currentSemester.totalWeeks,
        semesterStart: currentSemester.startDate,
      });
    } else {
      setSchedule({
        courses: userSchedule.courses,
        currentWeek: userSchedule.currentWeek,
        totalWeeks: userSchedule.totalWeeks,
        semesterStart: userSchedule.semesterStart,
      });
    }
  }, []);

  const addCourse = useCallback((course: Course) => {
    setSchedule((prev) => {
      const newSchedule = {
        ...prev,
        courses: [...prev.courses, course],
      };
      saveData(newSchedule);
      return newSchedule;
    });
  }, [saveData]);

  const updateCourse = useCallback((updatedCourse: Course) => {
    setSchedule((prev) => {
      const newSchedule = {
        ...prev,
        courses: prev.courses.map((c) =>
          c.id === updatedCourse.id ? updatedCourse : c
        ),
      };
      saveData(newSchedule);
      return newSchedule;
    });
  }, [saveData]);

  const deleteCourse = useCallback((courseId: string) => {
    setSchedule((prev) => {
      const newSchedule = {
        ...prev,
        courses: prev.courses.filter((c) => c.id !== courseId),
      };
      saveData(newSchedule);
      return newSchedule;
    });
  }, [saveData]);

  const importCourses = useCallback((courses: Course[]) => {
    setSchedule((prev) => {
      const newSchedule = {
        ...prev,
        courses: [...prev.courses, ...courses],
      };
      saveData(newSchedule);
      return newSchedule;
    });
  }, [saveData]);

  const clearAllCourses = useCallback(() => {
    setSchedule((prev) => {
      const newSchedule = {
        ...prev,
        courses: [],
      };
      saveData(newSchedule);
      return newSchedule;
    });
  }, [saveData]);

  const setCurrentWeek = useCallback((week: number) => {
    setSchedule((prev) => {
      const newSchedule = {
        ...prev,
        currentWeek: Math.max(1, Math.min(week, prev.totalWeeks)),
      };
      saveData(newSchedule);
      return newSchedule;
    });
  }, [saveData]);

  const switchSemester = useCallback((semesterId: string) => {
    const semester = semesters.find(s => s.id === semesterId);
    if (semester) {
      const currentWeek = calculateCurrentWeek(semester.startDate, semester.totalWeeks);

      setSchedule((prev) => {
        const newSchedule = {
          ...prev,
          currentWeek,
          totalWeeks: semester.totalWeeks,
          semesterStart: semester.startDate,
        };
        saveData(newSchedule);
        return newSchedule;
      });

      setCurrentSemesterId(semesterId);

      const userId = getCurrentUserId();
      if (userId) {
        const userSchedule = getUserSchedule(userId);
        saveUserSchedule(userId, {
          ...userSchedule,
          currentSemesterId: semesterId,
        });
      }
    }
  }, [semesters, saveData]);

  const updateSemester = useCallback((semester: Semester) => {
    const userId = getCurrentUserId();
    if (userId) {
      updateSemesterInStore(userId, semester);
      setSemesters(getUserSemesters(userId));

      if (semester.id === currentSemesterId) {
        const currentWeek = calculateCurrentWeek(semester.startDate, semester.totalWeeks);
        setSchedule((prev) => ({
          ...prev,
          currentWeek,
          totalWeeks: semester.totalWeeks,
          semesterStart: semester.startDate,
        }));
      }
    }
  }, [currentSemesterId]);

  return (
    <ScheduleContext.Provider
      value={{
        schedule,
        semesters,
        currentSemesterId,
        addCourse,
        updateCourse,
        deleteCourse,
        importCourses,
        clearAllCourses,
        setCurrentWeek,
        switchSemester,
        updateSemester,
        reloadForCurrentUser,
        customTimes,
        setCustomTimes,
        cloudUserId,
        cloudSessionToken,
        setCloudAuth,
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
