'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import {
  CalendarCheck,
  Check,
  X,
  Clock,
  AlertCircle,
  LogOut,
  Save,
  ChevronLeft,
  ChevronRight,
  Users,
  TrendingUp,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────
type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'EARLY_LEAVE';

interface ClassInfo {
  id: string;
  name: string;
  grade?: number;
  section?: string;
  _count?: { students: number };
}

interface StudentInfo {
  id: string;
  rollNumber?: string;
  user: {
    id: string;
    username: string;
    profile?: {
      firstName: string;
      lastName?: string;
      avatar?: string;
    };
  };
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  date: string;
  note?: string;
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  earlyLeave: number;
  rate: number;
}

// ── Status config ─────────────────────────────────────────
const statusConfig: Record<AttendanceStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  PRESENT:     { label: 'Present',     icon: Check,        color: 'text-emerald-600',  bg: 'bg-emerald-100' },
  ABSENT:      { label: 'Absent',      icon: X,            color: 'text-red-600',      bg: 'bg-red-100' },
  LATE:        { label: 'Late',        icon: Clock,        color: 'text-amber-600',    bg: 'bg-amber-100' },
  EXCUSED:     { label: 'Excused',     icon: AlertCircle,  color: 'text-blue-600',     bg: 'bg-blue-100' },
  EARLY_LEAVE: { label: 'Early Leave', icon: LogOut,        color: 'text-purple-600',   bg: 'bg-purple-100' },
};

// ── Main Page ─────────────────────────────────────────────
export default function AttendancePage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';

  if (isTeacher) return <TeacherAttendance />;
  if (isStudent || isParent) return <StudentAttendance />;

  // Admin: show overview
  return <AdminAttendance />;
}

// ── Teacher View ──────────────────────────────────────────
function TeacherAttendance() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [records, setRecords] = useState<Map<string, AttendanceStatus>>(new Map());
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load teacher's classes
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/classes', { params: { teacherId: user?.id } });
        setClasses(res.data.data || []);
      } catch {
        setError('Failed to load classes');
      }
    })();
  }, [user?.id]);

  // Load students when class selected
  const loadClassData = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError('');
    try {
      // Load students
      const studentsRes = await api.get(`/students`, { params: { classId: selectedClass } });
      const studentList: StudentInfo[] = studentsRes.data.data || [];
      setStudents(studentList);

      // Load existing attendance for this date
      const attRes = await api.get(`/gradebook/classes/${selectedClass}/attendance`, {
        params: { date: selectedDate },
      });
      const existingRecords: AttendanceRecord[] = attRes.data.data || [];

      const statusMap = new Map<string, AttendanceStatus>();
      existingRecords.forEach(r => {
        statusMap.set(r.studentId, r.status);
      });
      setRecords(statusMap);
    } catch {
      setError('Failed to load class data');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    loadClassData();
  }, [loadClassData]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => {
      const next = new Map(prev);
      next.set(studentId, status);
      return next;
    });
  };

  const setNote = (studentId: string, note: string) => {
    setNotes(prev => {
      const next = new Map(prev);
      next.set(studentId, note);
      return next;
    });
  };

  const markAll = (status: AttendanceStatus) => {
    const next = new Map<string, AttendanceStatus>();
    students.forEach(s => next.set(s.user.id, status));
    setRecords(next);
  };

  const saveAttendance = async () => {
    if (!selectedClass || records.size === 0) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const attendanceRecords = students.map(s => ({
        studentId: s.id,
        classId: selectedClass,
        status: records.get(s.user.id) || 'PRESENT',
        date: new Date(selectedDate),
        note: notes.get(s.user.id) || undefined,
      }));

      await api.post('/gradebook/attendance/bulk', { records: attendanceRecords });
      setSuccess(`Attendance saved for ${attendanceRecords.length} students`);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const summary = {
    present: Array.from(records.values()).filter(s => s === 'PRESENT').length,
    absent: Array.from(records.values()).filter(s => s === 'ABSENT').length,
    late: Array.from(records.values()).filter(s => s === 'LATE').length,
    excused: Array.from(records.values()).filter(s => s === 'EXCUSED').length,
    earlyLeave: Array.from(records.values()).filter(s => s === 'EARLY_LEAVE').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            {t('nav.attendance')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Mark and track student attendance</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-card rounded-xl border border-border">
        {/* Class selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">Select class…</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Date picker */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Quick actions */}
        {selectedClass && students.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => markAll('PRESENT')}
              className="px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-colors"
            >
              All Present
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{success}</div>
      )}

      {/* Summary cards */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'EARLY_LEAVE'] as AttendanceStatus[]).map(status => {
            const cfg = statusConfig[status];
            const count = summary[status.toLowerCase() as keyof typeof summary];
            return (
              <div key={status} className={`p-3 rounded-lg ${cfg.bg} flex items-center gap-2`}>
                <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Student list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading students…</div>
      ) : !selectedClass ? (
        <div className="text-center py-12 text-muted-foreground">Select a class to mark attendance</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No students in this class</div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const currentStatus = records.get(student.user.id) || 'PRESENT';
                const cfg = statusConfig[currentStatus];
                return (
                  <tr key={student.user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {student.user.profile?.firstName?.[0] || student.user.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {student.user.profile ? `${student.user.profile.firstName} ${student.user.profile.lastName || ''}` : student.user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {(Object.keys(statusConfig) as AttendanceStatus[]).map(status => {
                          const sc = statusConfig[status];
                          const isActive = currentStatus === status;
                          return (
                            <button
                              key={status}
                              onClick={() => setStatus(student.user.id, status)}
                              title={sc.label}
                              className={`p-1.5 rounded-md transition-colors ${
                                isActive ? `${sc.bg} ${sc.color} ring-2 ring-offset-1 ring-primary/30` : 'text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              <sc.icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={notes.get(student.user.id) || ''}
                        onChange={(e) => setNote(student.user.id, e.target.value)}
                        placeholder="Optional note…"
                        className="w-full px-2 py-1 text-xs rounded border border-input bg-background text-foreground focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Student View ──────────────────────────────────────────
function StudentAttendance() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Get student record
        const studentRes = await api.get('/students/me');
        const studentId = studentRes.data.data?.id;
        if (!studentId) return;

        // Get attendance records
        const attRes = await api.get(`/gradebook/students/${studentId}/attendance`);
        setRecords(attRes.data.data || []);

        // Get summary
        const sumRes = await api.get(`/gradebook/students/${studentId}/attendance/summary`);
        setSummary(sumRes.data.data);
      } catch {
        // Silent fail — might not have student record yet
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const monthName = selectedMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          {t('nav.attendance')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your attendance overview</p>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Attendance Rate</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{summary.rate}%</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <p className="text-xs text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-emerald-600">{summary.present}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-xs text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-muted-foreground">Late</p>
            <p className="text-2xl font-bold text-amber-600">{summary.late}</p>
          </div>
        </div>
      )}

      {/* Records */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No attendance records yet</div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Note</th>
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 50).map(record => {
                const cfg = statusConfig[record.status];
                return (
                  <tr key={record.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">
                      {new Date(record.date).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{record.note || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Admin Overview ────────────────────────────────────────
function AdminAttendance() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classSummary, setClassSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/classes');
        setClasses(res.data.data || []);
      } catch {
        // Silent
      }
    })();
  }, []);

  const loadClassSummary = async (classId: string) => {
    setSelectedClass(classId);
    if (!classId) return;
    setLoading(true);
    try {
      const res = await api.get(`/gradebook/classes/${classId}/attendance`, {
        params: { date: new Date().toISOString() },
      });
      setClassSummary(res.data.data);
    } catch {
      setClassSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          {t('nav.attendance')}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">School-wide attendance overview</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 p-4 bg-card rounded-xl border border-border">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => loadClassSummary(e.target.value)}
            className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">All classes…</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Class cards */}
      {!selectedClass && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="p-5 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">{c.name}</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{c._count?.students || 0} students</p>
              <button
                onClick={() => loadClassSummary(c.id)}
                className="mt-3 text-xs text-primary hover:underline"
              >
                View attendance →
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="text-center py-12 text-muted-foreground">Loading…</div>}

      {selectedClass && !loading && classSummary && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Today's Attendance</h3>
          {Array.isArray(classSummary) && classSummary.length > 0 ? (
            <div className="space-y-2">
              {classSummary.map((r: AttendanceRecord) => {
                const cfg = statusConfig[r.status];
                return (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-sm text-foreground">{r.studentId}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${cfg.bg} ${cfg.color}`}>
                      <cfg.icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No records for today</p>
          )}
        </div>
      )}
    </div>
  );
}
