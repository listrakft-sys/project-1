'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n';

// ── Types ──────────────────────────────────────────────────
interface Student {
  id: string;
  user: { username: string; profile: { firstName: string; lastName: string } | null };
}

interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  type: string;
  score: number;
  maxScore: number;
  weight: number;
  comment: string | null;
  date: string;
  term: string;
  student?: Student;
}

interface ClassOverview {
  student: Student;
  grades: Grade[];
  average: number | null;
  attendance: { present: number; absent: number; late: number; total: number };
}

interface ClassInfo {
  id: string;
  name: string;
  grade: number;
}
interface SubjectInfo {
  id: string;
  name: string;
  code: string;
}

const GRADE_TYPES = [
  { value: 'WRITTEN', label: '✍️ Written', color: 'bg-blue-100 text-blue-700' },
  { value: 'ORAL', label: '🗣️ Oral', color: 'bg-purple-100 text-purple-700' },
  { value: 'TEST', label: '📋 Test', color: 'bg-red-100 text-red-700' },
  { value: 'QUIZ', label: '❓ Quiz', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HOMEWORK', label: '📝 Homework', color: 'bg-green-100 text-green-700' },
  { value: 'PROJECT', label: '🔬 Project', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'PARTICIPATION', label: '✋ Participation', color: 'bg-orange-100 text-orange-700' },
  { value: 'FINAL', label: '🏆 Final', color: 'bg-pink-100 text-pink-700' },
];

const ATTENDANCE_STATUSES = [
  { value: 'PRESENT', label: '✅ Present', color: 'text-green-600' },
  { value: 'ABSENT', label: '❌ Absent', color: 'text-red-600' },
  { value: 'LATE', label: '⏰ Late', color: 'text-yellow-600' },
  { value: 'EXCUSED', label: '📋 Excused', color: 'text-blue-600' },
  { value: 'EARLY_LEAVE', label: '🚪 Early Leave', color: 'text-orange-600' },
];

export default function GradebookPage() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1');
  const [overview, setOverview] = useState<ClassOverview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'grades' | 'attendance'>('grades');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGrade, setNewGrade] = useState({
    studentId: '',
    type: 'WRITTEN',
    score: 0,
    maxScore: 10,
    weight: 1.0,
    comment: '',
  });
  const [savingGrade, setSavingGrade] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSubjects();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadOverview();
      if (activeTab === 'attendance') {
        loadAttendance();
      }
    }
  }, [selectedClass, selectedSubject, selectedTerm, activeTab]);

  const loadClasses = async () => {
    try {
      const res = await apiClient.get('/classes');
      setClasses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await apiClient.get(`/classes/${selectedClass}/subjects`);
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error('Failed to load subjects', err);
    }
  };

  const loadOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/gradebook/classes/${selectedClass}/subjects/${selectedSubject}/overview`, {
        params: { term: selectedTerm },
      });
      setOverview(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error loading gradebook');
      setOverview([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await apiClient.get(`/gradebook/classes/${selectedClass}/attendance`, {
        params: { date: attendanceDate },
      });
      const records: Record<string, string> = {};
      (res.data.data || []).forEach((item: any) => {
        if (item.attendance) {
          records[item.student.id] = item.attendance.status;
        } else {
          records[item.student.id] = 'PRESENT';
        }
      });
      setAttendanceRecords(records);
    } catch (err) {
      console.error('Failed to load attendance', err);
    }
  };

  const saveAttendance = async () => {
    setSavingAttendance(true);
    setError('');
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        classId: selectedClass,
        subjectId: selectedSubject,
        status,
        date: new Date(attendanceDate),
      }));
      const res = await apiClient.post('/gradebook/attendance/bulk', { records });
      setError(`✅ ${res.data.data.marked}/${res.data.data.total} marked`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error saving attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const saveGrade = async () => {
    if (!newGrade.studentId) {
      setError('Select a student');
      return;
    }
    setSavingGrade(true);
    setError('');
    try {
      await apiClient.post('/gradebook/grades', {
        ...newGrade,
        classId: selectedClass,
        subjectId: selectedSubject,
        score: parseFloat(String(newGrade.score)),
        maxScore: parseFloat(String(newGrade.maxScore)),
        weight: parseFloat(String(newGrade.weight)),
        term: selectedTerm,
      });
      setShowAddGrade(false);
      setNewGrade({ studentId: '', type: 'WRITTEN', score: 0, maxScore: 10, weight: 1.0, comment: '' });
      loadOverview();
      setError('✅ Grade saved');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error saving grade');
    } finally {
      setSavingGrade(false);
    }
  };

  const deleteGrade = async (gradeId: string) => {
    try {
      await apiClient.delete(`/gradebook/grades/${gradeId}`);
      loadOverview();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error deleting grade');
    }
  };

  const getGradeColor = (score: number, maxScore: number) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 90) return 'text-green-600 font-bold';
    if (pct >= 70) return 'text-blue-600 font-semibold';
    if (pct >= 50) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-bold';
  };

  return (
    <div className="space-y-6 p-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📓 Gradebook</h1>
          <p className="text-sm text-gray-500 mt-1">Manage grades & attendance</p>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name} (Grade {c.grade})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            disabled={!selectedClass}
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Term</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1">Term 1</option>
            <option value="2">Term 2</option>
            <option value="3">Term 3</option>
            <option value="4">Term 4</option>
          </select>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'grades'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 Grades
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 text-sm font-medium transition ${
            activeTab === 'attendance'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📅 Attendance
        </button>
      </div>

      {error && (
        <div className={`px-4 py-2 rounded-lg text-sm ${error.startsWith('✅') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      {!selectedClass || !selectedSubject ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">Select a class and subject to view the gradebook</p>
        </div>
      ) : loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'grades' ? (
        /* ── GRADES TAB ────────────────────────────────────── */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">
              {overview.length} students · Term {selectedTerm}
            </h2>
            <button
              onClick={() => setShowAddGrade(!showAddGrade)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
            >
              + Add Grade
            </button>
          </div>

          {/* Add grade form */}
          {showAddGrade && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h3 className="font-semibold text-sm text-gray-700">New Grade</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select
                  value={newGrade.studentId}
                  onChange={(e) => setNewGrade({ ...newGrade, studentId: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Student...</option>
                  {overview.map((o) => (
                    <option key={o.student.id} value={o.student.id}>
                      {o.student.user.profile?.firstName || o.student.user.username}
                    </option>
                  ))}
                </select>
                <select
                  value={newGrade.type}
                  onChange={(e) => setNewGrade({ ...newGrade, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {GRADE_TYPES.map((gt) => (
                    <option key={gt.value} value={gt.value}>{gt.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Score"
                    value={newGrade.score}
                    onChange={(e) => setNewGrade({ ...newGrade, score: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={newGrade.maxScore}
                    onChange={(e) => setNewGrade({ ...newGrade, maxScore: parseFloat(e.target.value) || 10 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Weight"
                  value={newGrade.weight}
                  onChange={(e) => setNewGrade({ ...newGrade, weight: parseFloat(e.target.value) || 1 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Comment (optional)"
                value={newGrade.comment}
                onChange={(e) => setNewGrade({ ...newGrade, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveGrade}
                  disabled={savingGrade}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {savingGrade ? 'Saving...' : 'Save Grade'}
                </button>
                <button
                  onClick={() => setShowAddGrade(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Gradebook table */}
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Grades</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Average</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {overview.map((item, idx) => (
                  <tr key={item.student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.student.user.profile
                        ? `${item.student.user.profile.firstName} ${item.student.user.profile.lastName || ''}`
                        : item.student.user.username}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {item.grades.length === 0 ? (
                          <span className="text-gray-300 text-xs">—</span>
                        ) : (
                          item.grades.map((g) => (
                            <span
                              key={g.id}
                              className={`px-2 py-1 rounded-md text-xs ${getGradeColor(g.score, g.maxScore)} bg-gray-100`}
                              title={`${g.type} · ${g.score}/${g.maxScore} · ${g.comment || ''}`}
                            >
                              {g.score}
                              <span className="text-gray-400">/{g.maxScore}</span>
                              <button
                                onClick={() => deleteGrade(g.id)}
                                className="ml-1 text-gray-300 hover:text-red-500"
                                title="Delete"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="text-center px-4 py-3">
                      {item.average !== null ? (
                        <span className={`text-lg ${getGradeColor(item.average, 100)}`}>
                          {item.average.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="text-center px-4 py-3 text-xs">
                      {item.attendance.total > 0 ? (
                        <span className="space-x-1">
                          <span className="text-green-600">✅{item.attendance.present}</span>
                          <span className="text-yellow-600">⏰{item.attendance.late}</span>
                          <span className="text-red-600">❌{item.attendance.absent}</span>
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── ATTENDANCE TAB ────────────────────────────────── */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => {
                  setAttendanceDate(e.target.value);
                  setTimeout(loadAttendance, 100);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button
              onClick={saveAttendance}
              disabled={savingAttendance}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {savingAttendance ? 'Saving...' : '💾 Save Attendance'}
            </button>
          </div>

          {/* Attendance grid */}
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {overview.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No students</p>
            ) : (
              overview.map((item) => (
                <div key={item.student.id} className="flex items-center justify-between px-4 py-3">
                  <div className="font-medium text-gray-800 text-sm">
                    {item.student.user.profile
                      ? `${item.student.user.profile.firstName} ${item.student.user.profile.lastName || ''}`
                      : item.student.user.username}
                  </div>
                  <div className="flex gap-1.5">
                    {ATTENDANCE_STATUSES.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setAttendanceRecords({
                          ...attendanceRecords,
                          [item.student.id]: status.value,
                        })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          attendanceRecords[item.student.id] === status.value
                            ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
