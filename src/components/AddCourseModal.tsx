import { useState, useEffect } from 'react';
import { Course, ExamType, CourseMode } from '../types';
import { DAY_NAMES } from '../types';
import { COURSE_COLORS, generateId } from '../utils/schedule';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (course: Course) => void;
  existingCourses: Course[];
  editingCourse?: Course | null;
}

export function AddCourseModal({ isOpen, onClose, onAdd, existingCourses, editingCourse }: AddCourseModalProps) {
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [location, setLocation] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [startSection, setStartSection] = useState(1);
  const [endSection, setEndSection] = useState(1);
  const [color, setColor] = useState(COURSE_COLORS[0]);
  const [examType, setExamType] = useState<ExamType | undefined>(undefined);
  const [courseMode, setCourseMode] = useState<CourseMode | undefined>(undefined);
  const [startWeek, setStartWeek] = useState<number | undefined>(undefined);
  const [endWeek, setEndWeek] = useState<number | undefined>(undefined);
  const [error, setError] = useState('');

  // 当编辑课程时填充表单
  useEffect(() => {
    if (editingCourse) {
      setName(editingCourse.name);
      setTeacher(editingCourse.teacher || '');
      setLocation(editingCourse.location || '');
      setDayOfWeek(editingCourse.dayOfWeek);
      setStartSection(editingCourse.startSection);
      setEndSection(editingCourse.endSection);
      setColor(editingCourse.color);
      setExamType(editingCourse.examType);
      setCourseMode(editingCourse.courseMode);
      setStartWeek(editingCourse.startWeek);
      setEndWeek(editingCourse.endWeek);
    } else {
      resetForm();
    }
  }, [editingCourse, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入课程名称');
      return;
    }
    if (endSection < startSection) {
      setError('结束节次不能早于开始节次');
      return;
    }
    if (startWeek && endWeek && endWeek < startWeek) {
      setError('结束周不能早于开始周');
      return;
    }

    const course: Course = {
      id: editingCourse?.id || generateId(),
      name: name.trim(),
      teacher: teacher.trim() || undefined,
      location: location.trim() || undefined,
      dayOfWeek,
      startSection,
      endSection,
      color,
      examType,
      courseMode,
      startWeek,
      endWeek,
    };

    onAdd(course);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setTeacher('');
    setLocation('');
    setDayOfWeek(1);
    setStartSection(1);
    setEndSection(1);
    setColor(COURSE_COLORS[0]);
    setExamType(undefined);
    setCourseMode(undefined);
    setStartWeek(undefined);
    setEndWeek(undefined);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold" style={{ color: '#2D3436' }}>
            {editingCourse ? '编辑课程' : '添加课程'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#636E72"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
              课程名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：高等数学"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              style={{ color: '#2D3436' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                上课星期
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                {DAY_NAMES.map((day, index) => (
                  <option key={index} value={index + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                上课地点
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例如：教学楼A101"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                style={{ color: '#2D3436' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                开始节次
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={startSection}
                onChange={(e) => setStartSection(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
                style={{ color: '#2D3436' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                结束节次
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={endSection}
                onChange={(e) => setEndSection(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
                style={{ color: '#2D3436' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                开始周
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={startWeek || ''}
                onChange={(e) => setStartWeek(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="如：3"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
                style={{ color: '#2D3436' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                结束周
              </label>
              <input
                type="number"
                min={1}
                max={25}
                value={endWeek || ''}
                onChange={(e) => setEndWeek(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="如：16"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
                style={{ color: '#2D3436' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
              授课教师
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="例如：张教授"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              style={{ color: '#2D3436' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                考核类型
              </label>
              <select
                value={examType || ''}
                onChange={(e) => setExamType(e.target.value as ExamType || undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">未设置</option>
                <option value="exam">考试课</option>
                <option value="check">考察课</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2D3436' }}>
                上课方式
              </label>
              <select
                value={courseMode || ''}
                onChange={(e) => setCourseMode(e.target.value as CourseMode || undefined)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">未设置</option>
                <option value="offline">线下课</option>
                <option value="online">线上课</option>
                <option value="hybrid">混合课</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2D3436' }}>
              课程颜色
            </label>
            <div className="flex gap-2 flex-wrap">
              {COURSE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: c,
                    '--tw-ring-color': c,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </form>

        <div className="px-6 py-4 border-t border-border bg-gray-50/50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-white hover:bg-gray-100 transition-colors"
            style={{ color: '#636E72' }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
          >
            {editingCourse ? '保存修改' : '添加课程'}
          </button>
        </div>
      </div>
    </div>
  );
}
