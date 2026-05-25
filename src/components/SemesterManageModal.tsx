import { useState, useEffect } from 'react';
import { Semester } from '../types';
import { generateId } from '../types';
import { addSemester, deleteSemester, getCurrentUserId } from '../utils/userStore';

interface SemesterManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesters: Semester[];
  currentSemesterId: string;
  onSwitchSemester: (semesterId: string) => void;
  onUpdateSemester: (semester: Semester) => void;
}

export function SemesterManageModal({
  isOpen,
  onClose,
  semesters,
  currentSemesterId,
  onSwitchSemester,
  onUpdateSemester,
}: SemesterManageModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 添加表单状态
  const [newYearStart, setNewYearStart] = useState(() => new Date().getFullYear());
  const [newYearEnd, setNewYearEnd] = useState(() => new Date().getFullYear() + 1);
  const [newTerm, setNewTerm] = useState<1 | 2>(1);
  const [newStartDate, setNewStartDate] = useState('');
  const [newTotalWeeks, setNewTotalWeeks] = useState(20);

  // 编辑表单状态
  const [editStartDate, setEditStartDate] = useState('');
  const [editTotalWeeks, setEditTotalWeeks] = useState(20);

  useEffect(() => {
    if (editingSemester) {
      setEditStartDate(editingSemester.startDate);
      setEditTotalWeeks(editingSemester.totalWeeks);
    }
  }, [editingSemester]);

  // 按学年分组
  const groupedSemesters = semesters.reduce((acc, sem) => {
    const key = `${sem.yearStart}-${sem.yearEnd}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(sem);
    return acc;
  }, {} as Record<string, Semester[]>);

  const handleAddSemester = () => {
    if (!newStartDate) {
      alert('请选择开学日期');
      return;
    }
    const userId = getCurrentUserId();
    if (!userId) return;

    const name = `${newYearStart}-${newYearEnd}学年 ${newTerm === 1 ? '第一' : '第二'}学期`;
    addSemester(userId, {
      name,
      yearStart: newYearStart,
      yearEnd: newYearEnd,
      term: newTerm,
      startDate: newStartDate,
      totalWeeks: newTotalWeeks,
    });

    // 重置表单
    setShowAddForm(false);
    setNewStartDate('');
    setNewTotalWeeks(20);
    setNewTerm(newTerm === 1 ? 2 : 1); // 默认切换到另一个学期

    // 刷新页面以获取新学期
    window.location.reload();
  };

  const handleUpdateSemester = () => {
    if (!editingSemester) return;

    const name = `${editingSemester.yearStart}-${editingSemester.yearEnd}学年 ${editingSemester.term === 1 ? '第一' : '第二'}学期`;
    onUpdateSemester({
      ...editingSemester,
      name,
      startDate: editStartDate,
      totalWeeks: editTotalWeeks,
    });
    setEditingSemester(null);
  };

  const handleDeleteSemester = (semesterId: string) => {
    if (semesters.length <= 1) {
      alert('至少需要保留一个学期');
      return;
    }
    const userId = getCurrentUserId();
    if (!userId) return;

    deleteSemester(userId, semesterId);
    setDeleteConfirm(null);

    // 如果删除的是当前学期，切换到第一个
    if (semesterId === currentSemesterId && semesters.length > 1) {
      const remaining = semesters.filter(s => s.id !== semesterId);
      if (remaining.length > 0) {
        onSwitchSemester(remaining[0].id);
      }
    }

    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: '#2D3436' }}>
                学期管理
              </h2>
              <p className="text-xs" style={{ color: '#636E72' }}>
                切换或管理学期
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 学期列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedSemesters).map(([yearKey, yearSemesters]) => (
            <div key={yearKey} className="mb-6">
              <h3 className="text-sm font-medium mb-2" style={{ color: '#636E72' }}>
                {yearKey}学年
              </h3>
              <div className="space-y-2">
                {yearSemesters.map((semester) => (
                  <div
                    key={semester.id}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      currentSemesterId === semester.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium" style={{ color: '#2D3436' }}>
                          {semester.term === 1 ? '第一学期' : '第二学期'}
                          {currentSemesterId === semester.id && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                              使用中
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#636E72' }}>
                          开学: {semester.startDate} · {semester.totalWeeks}周
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentSemesterId !== semester.id && (
                          <button
                            onClick={() => {
                              onSwitchSemester(semester.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg font-medium hover:bg-blue-600 transition-colors"
                          >
                            切换
                          </button>
                        )}
                        <button
                          onClick={() => setEditingSemester(semester)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#636E72" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {semesters.length > 1 && (
                          deleteConfirm === semester.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteSemester(semester.id)}
                                className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1.5 rounded-lg bg-gray-300 text-gray-600 hover:bg-gray-400"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(semester.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 添加新学期 */}
        <div className="p-4 border-t border-border bg-gray-50 flex-shrink-0">
          {showAddForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">开始学年</label>
                  <input
                    type="number"
                    value={newYearStart}
                    onChange={(e) => setNewYearStart(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">结束学年</label>
                  <input
                    type="number"
                    value={newYearEnd}
                    onChange={(e) => setNewYearEnd(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">学期</label>
                  <select
                    value={newTerm}
                    onChange={(e) => setNewTerm(parseInt(e.target.value) as 1 | 2)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <option value={1}>第一学期</option>
                    <option value={2}>第二学期</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">开学日期</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">周数</label>
                  <input
                    type="number"
                    value={newTotalWeeks}
                    onChange={(e) => setNewTotalWeeks(parseInt(e.target.value))}
                    min={1}
                    max={30}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSemester}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  添加
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-green-300 rounded-xl text-green-600 font-medium hover:bg-green-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加新学期
            </button>
          )}
        </div>

        {/* 编辑学期弹窗 */}
        {editingSemester && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white p-4 rounded-xl max-w-sm mx-4 w-full">
              <h3 className="font-medium mb-3" style={{ color: '#2D3436' }}>
                编辑学期设置
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">开学日期</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">周数</label>
                  <input
                    type="number"
                    value={editTotalWeeks}
                    onChange={(e) => setEditTotalWeeks(parseInt(e.target.value))}
                    min={1}
                    max={30}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateSemester}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingSemester(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认 */}
        {deleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white p-4 rounded-xl max-w-xs mx-4">
              <p className="text-sm text-gray-600 mb-4">
                确定要删除这个学期吗？<br />
                <strong className="text-red-500">此操作不可撤销</strong>。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDeleteSemester(deleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
