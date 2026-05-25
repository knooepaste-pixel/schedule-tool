import { useState, useEffect, useCallback } from 'react';
import { Course } from './types';
import { useSchedule } from './context/ScheduleContext';
import { exportScheduleToJSON, downloadJSON } from './utils/schedule';
import { cloudLoadSchedule, loadCloudSession, clearCloudSession } from './utils/cloudStore';
import { Header } from './components/Header';
import { ScheduleTable } from './components/ScheduleTable';
import { ScreenshotImportModal } from './components/ScreenshotImportModal';
import { SimpleImportModal } from './components/SimpleImportModal';
import { AIImportModal } from './components/AIImportModal';
import { AIChatModal } from './components/AIChatModal';
import { AddCourseModal } from './components/AddCourseModal';
import { CourseDetailModal } from './components/CourseDetailModal';
import { UserSwitchModal } from './components/UserSwitchModal';
import { SemesterManageModal } from './components/SemesterManageModal';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { DataBackupModal } from './components/DataBackupModal';

export function App() {
  const {
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
    setCloudAuth,
  } = useSchedule();

  const [showImportModal, setShowImportModal] = useState(false);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [showSimpleImportModal, setShowSimpleImportModal] = useState(false);
  const [showAIImportModal, setShowAIImportModal] = useState(false);
  const [showAIChatModal, setShowAIChatModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUserSwitchModal, setShowUserSwitchModal] = useState(false);
  const [showSemesterManageModal, setShowSemesterManageModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [initializing, setInitializing] = useState(true);

  // ── 初始化：检查云端会话 ────────────────────────────
  useEffect(() => {
    const session = loadCloudSession();
    if (session) {
      setCloudAuth(session.userId, session.sessionToken);
      setCurrentUserName(session.username);
      setShowLoginModal(false);
    } else {
      setShowLoginModal(true);
    }
    setInitializing(false);
  }, [setCloudAuth]);

  const handleLogin = useCallback((userId: string, sessionToken: string, userName: string) => {
    setCloudAuth(userId, sessionToken);
    setCurrentUserName(userName);
    setShowLoginModal(false);
  }, [setCloudAuth]);

  const handleLogout = useCallback(() => {
    clearCloudSession();
    setCurrentUserName('');
    setShowLoginModal(true);
    clearAllCourses();
  }, [clearAllCourses]);

  const handleCourseClick = (course: Course) => {
    setEditingCourse(course);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    const json = exportScheduleToJSON(schedule);
    downloadJSON(json, `课表_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleEditFromDetail = (course: Course) => {
    setEditingCourse(course);
    setShowDetailModal(false);
    setShowAddModal(true);
  };

  const handleAddCourse = (course: Course) => {
    if (editingCourse) {
      updateCourse({ ...course, id: editingCourse.id });
      setEditingCourse(null);
    } else {
      addCourse(course);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有课程吗？此操作不可撤销。')) {
      clearAllCourses();
    }
  };

  return (
    <>
      <LoginModal
        isOpen={showLoginModal}
        onLogin={handleLogin}
      />

      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: '#FAFBFC' }}
      >
        <Header
          courses={schedule.courses}
          semesters={semesters}
          currentSemesterId={currentSemesterId}
          onImport={() => setShowImportModal(true)}
          onExport={handleExport}
          onUserSwitch={() => setShowUserSwitchModal(true)}
          onSemesterManage={() => setShowSemesterManageModal(true)}
          onSettings={() => setShowSettingsModal(true)}
          onBackup={() => setShowBackupModal(true)}
          onAIChat={() => setShowAIChatModal(true)}
          onClearAll={handleClearAll}
          userName={currentUserName}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto h-full">
            <ScheduleTable
              courses={schedule.courses}
              selectedCourse={editingCourse}
              currentWeek={schedule.currentWeek}
              totalWeeks={schedule.totalWeeks}
              semesterStart={schedule.semesterStart}
              onWeekChange={setCurrentWeek}
              onCourseClick={handleCourseClick}
              onAddCourse={() => {
                setEditingCourse(null);
                setShowAddModal(true);
              }}
              onImport={() => setShowImportModal(true)}
              customTimes={customTimes}
            />
          </div>
        </main>

        <div className="p-4">
          <button
            onClick={() => {
              setEditingCourse(null);
              setShowAddModal(true);
            }}
            className="w-full py-3 rounded-xl bg-accent text-white font-medium shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加课程
          </button>
        </div>

        <ScreenshotImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />

        <ScreenshotImportModal
          isOpen={showScreenshotModal}
          onClose={() => setShowScreenshotModal(false)}
        />

        <SimpleImportModal
          isOpen={showSimpleImportModal}
          onClose={() => setShowSimpleImportModal(false)}
        />

        <AIImportModal
          isOpen={showAIImportModal}
          onClose={() => setShowAIImportModal(false)}
        />

        <AIChatModal
          isOpen={showAIChatModal}
          onClose={() => setShowAIChatModal(false)}
        />

        <UserSwitchModal
          isOpen={showUserSwitchModal}
          onClose={() => setShowUserSwitchModal(false)}
          onUserSwitch={reloadForCurrentUser}
        />

        <SemesterManageModal
          isOpen={showSemesterManageModal}
          onClose={() => setShowSemesterManageModal(false)}
          semesters={semesters}
          currentSemesterId={currentSemesterId}
          onSwitchSemester={switchSemester}
          onUpdateSemester={updateSemester}
        />

        <AddCourseModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingCourse(null);
          }}
          onAdd={handleAddCourse}
          existingCourses={schedule.courses}
          editingCourse={editingCourse}
        />

        <CourseDetailModal
          course={showDetailModal ? editingCourse : null}
          onClose={() => {
            setShowDetailModal(false);
            setEditingCourse(null);
          }}
          onEdit={handleEditFromDetail}
          onDelete={(courseId) => {
            deleteCourse(courseId);
            setShowDetailModal(false);
            setEditingCourse(null);
          }}
        />

        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />

        <DataBackupModal
          isOpen={showBackupModal}
          onClose={() => setShowBackupModal(false)}
        />
      </div>
    </>
  );
}
