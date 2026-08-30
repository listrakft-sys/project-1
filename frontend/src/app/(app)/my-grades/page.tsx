'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { useTranslation } from '@/lib/i18n';

interface Grade {
  id: string;
  type: string;
  score: number;
  maxScore: number;
  weight: number;
  comment: string | null;
  date: string;
  term: string;
  subject: { id: string; name: string; code: string };
  teacher: { user: { username: string; profile: { firstName: string; lastName: string } | null } };
}

interface AttendanceRecord {
  id: string;
  status: string;
  date: string;
  note: string | null;
  class: { name: string };
  subject: { name: string } | null;
}

interface Average {
  overallAverage: number;
  subjects: Array<{ subjectId: string; average: number }>;
  totalGrades: number;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  earlyLeave: number;
  attendanceRate: number;
}

export default function MyGradesPage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [average, setAverage] = useState<Average | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'grades' | 'attendance'>('grades');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Get student profile to get studentId
      const profileRes = await apiClient.get('/auth/me');
      const studentId = profileRes.data.data?.student?.id;
      if (!studentId) {
        setError('Student profile not found');
        setLoading(false);
        return;
      }

      const [gradesRes, avgRes, attRes, attSumRes] = await Promise.all([
        apiClient.get(`/gradebook/students/${studentId}/grades`),
        apiClient.get(`/gradebook/students/${studentId}/average`),
        apiClient.get(`/gradebook/students/${studentId}/attendance`),
        apiClient.get(`/gradebook/students/${studentId}/attendance/summary`),
      ]);

      setGrades(gradesRes.data.data || []);
      setAverage(avgRes.data.data);
      setAttendance(attRes.data.data || []);
      setAttendanceSummary(attSumRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (score: number, maxScore: number) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 90) return 'text-green-600 bg-green-50';
    if (pct >= 70) return 'text-blue-600 bg-blue-50';
    if (pct >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAttendanceColor = (status: string) => {
    const colors: Record<string, string> = {
      PRESENT: 'text-green-600 bg-green-50',
      ABSENT: 'text-red-600 bg-red-50',
      LATE: 'text-yellow-600 bg-yellow-50',
      EXCUSED: 'text-blue-600 bg-blue-50',
      EARLY_LEAVE: 'text-orange-600 bg-orange-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📊 My Grades & Attendance</h1>
        <p className="text-sm text-gray-500 mt-1">Track your academic progress</p>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      {/* ── Summary Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Overall Average</p>
          <p className={`text-3xl font-bold ${average?.overallAverage >= 70 ? 'text-green-600' : average?.overallAverage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {average?.overallAverage ? `${average.overallAverage}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{average?.totalGrades || 0} grades total</p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Attendance Rate</p>
          <p className={`text-3xl font-bold ${(attendanceSummary?.attendanceRate || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
            {attendanceSummary?.attendanceRate ? `${attendanceSummary.attendanceRate}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ✅ {attendanceSummary?.present || 0} · ⏰ {attendanceSummary?.late || 0} · ❌ {attendanceSummary?.absent || 0}
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-1">Subjects</p>
          <p className="text-3xl font-bold text-indigo-600">{average?.subjects?.length || 0}</p>
          <p className="text-xs text-gray-400 mt-1">en progress</p>
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

      {activeTab === 'grades' ? (
        /* ── GRADES LIST ────────────────────────────────────── */
        <div className="space-y-3">
          {grades.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No grades yet</p>
          ) : (
            // Group by subject
            Object.entries(
              grades.reduce<Record<string, Grade[]>>((acc, g) => {
                if (!acc[g.subject.name]) acc[g.subject.name] = [];
                acc[g.subject.name].push(g);
                return acc;
              }, {})
            ).map(([subjectName, subjectGrades]) => (
              <div key={subjectName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700">{subjectName}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {subjectGrades.map((g) => (
                    <div key={g.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium mr-2 ${getGradeColor(g.score, g.maxScore)}`}>
                          {g.score}/{g.maxScore}
                        </span>
                        <span className="text-sm text-gray-500">{g.type}</span>
                        {g.comment && <p className="text-xs text-gray-400 mt-0.5">{g.comment}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(g.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {g.teacher?.user?.profile?.firstName || g.teacher?.user?.username || ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── ATTENDANCE LIST ────────────────────────────────── */
        <div className="space-y-2">
          {attendance.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No attendance records</p>
          ) : (
            attendance.map((rec) => (
              <div key={rec.id} className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200">
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium mr-2 ${getAttendanceColor(rec.status)}`}>
                    {rec.status}
                  </span>
                  <span className="text-sm text-gray-600">
                    {rec.class?.name}
                    {rec.subject?.name ? ` · ${rec.subject.name}` : ''}
                  </span>
                  {rec.note && <p className="text-xs text-gray-400 mt-0.5">{rec.note}</p>}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(rec.date).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
