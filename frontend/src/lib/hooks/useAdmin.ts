'use client';

import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';

export interface AdminStats {
  totals: {
    users: number;
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    lessons: number;
    announcements: number;
    schedules: number;
    pendingComplaints: number;
  };
  thisWeek: {
    newUsers: number;
    newComplaints: number;
    newAnnouncements: number;
  };
  metrics: {
    attendanceRate: number;
    gradeAverage: number;
  };
}

// Fallback for loading state
export const emptyStats: AdminStats = {
  totals: { users: 0, students: 0, teachers: 0, classes: 0, subjects: 0, lessons: 0, announcements: 0, schedules: 0, pendingComplaints: 0 },
  thisWeek: { newUsers: 0, newComplaints: 0, newAnnouncements: 0 },
  metrics: { attendanceRate: 0, gradeAverage: 0 },
};

export function useAdmin() {
  const { user } = useAuthStore();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
  const isAdmin = isSuperAdmin || isSchoolAdmin;

  // Stats
  const fetchStats = async (): Promise<AdminStats> => {
    try {
      const res = await apiClient.get('/admin/stats');
      return res.data?.data || res.data;
    } catch {
      return emptyStats;
    }
  };

  // Recent activity
  const fetchActivity = async (limit = 20) => {
    const res = await apiClient.get('/admin/activity', { params: { limit } });
    return res.data?.data || res.data;
  };

  // Users
  const fetchUsers = async (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get('/users', { params });
    return res.data;
  };

  const updateUserRole = async (userId: string, role: string) => {
    const res = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return res.data;
  };

  const updateUserStatus = async (userId: string, status: string) => {
    const res = await apiClient.put(`/admin/users/${userId}/status`, { status });
    return res.data;
  };

  const deleteUser = async (userId: string) => {
    const res = await apiClient.delete(`/users/${userId}`);
    return res.data;
  };

  // Classes
  const fetchClasses = async (schoolId?: string) => {
    const url = schoolId ? `/schools/${schoolId}/classes` : '/classes';
    const res = await apiClient.get(url);
    return res.data?.data || res.data;
  };

  const fetchClassDetails = async (classId: string) => {
    const res = await apiClient.get(`/classes/${classId}`);
    return res.data?.data || res.data;
  };

  const createClass = async (data: { name: string; grade: number; section?: string; capacity?: number; room?: string; homeroomTeacherId?: string }) => {
    const res = await apiClient.post('/classes', data);
    return res.data;
  };

  const updateClass = async (id: string, data: Partial<{ name: string; grade: number; section?: string; capacity?: number; room?: string; homeroomTeacherId?: string }>) => {
    const res = await apiClient.put(`/classes/${id}`, data);
    return res.data;
  };

  const deleteClass = async (id: string) => {
    const res = await apiClient.delete(`/classes/${id}`);
    return res.data;
  };

  // Subjects
  const fetchSubjects = async (schoolId?: string) => {
    const url = schoolId ? `/schools/${schoolId}/subjects` : '/subjects';
    const res = await apiClient.get(url);
    return res.data?.data || res.data;
  };

  const createSubject = async (data: { name: string; code: string; description?: string; color?: string; language?: string }) => {
    const res = await apiClient.post('/subjects', data);
    return res.data;
  };

  const updateSubject = async (id: string, data: Partial<{ name: string; code: string; description?: string; color?: string; language?: string }>) => {
    const res = await apiClient.put(`/subjects/${id}`, data);
    return res.data;
  };

  const deleteSubject = async (id: string) => {
    const res = await apiClient.delete(`/subjects/${id}`);
    return res.data;
  };

  const assignTeacherToSubject = async (subjectId: string, teacherId: string) => {
    const res = await apiClient.post(`/subjects/${subjectId}/teachers/${teacherId}`);
    return res.data;
  };

  const removeTeacherFromSubject = async (subjectId: string, teacherId: string) => {
    const res = await apiClient.delete(`/subjects/${subjectId}/teachers/${teacherId}`);
    return res.data;
  };

  // Schedules
  const fetchSchedulesForClass = async (classId: string) => {
    const res = await apiClient.get(`/schedules/class/${classId}`);
    return res.data?.data || res.data;
  };

  const createSchedule = async (data: { classId: string; subjectId?: string; teacherId?: string; dayOfWeek: number; startTime: string; endTime: string; room?: string }) => {
    const res = await apiClient.post('/schedules', data);
    return res.data;
  };

  const updateSchedule = async (id: string, data: Partial<{ subjectId?: string; teacherId?: string; dayOfWeek: number; startTime: string; endTime: string; room?: string }>) => {
    const res = await apiClient.put(`/schedules/${id}`, data);
    return res.data;
  };

  const deleteSchedule = async (id: string) => {
    const res = await apiClient.delete(`/schedules/${id}`);
    return res.data;
  };

  // Complaints
  const fetchComplaints = async (params?: { status?: string }) => {
    const res = await apiClient.get('/complaints', { params });
    return res.data?.data || res.data;
  };

  const fetchComplaintDetails = async (id: string) => {
    const res = await apiClient.get(`/complaints/${id}`);
    return res.data?.data || res.data;
  };

  const handleComplaint = async (id: string, status: string, resolution?: string) => {
    const res = await apiClient.put(`/complaints/${id}`, { status, resolution });
    return res.data;
  };

  // Announcements
  const fetchAnnouncements = async (params?: { audience?: string; classId?: string }) => {
    const res = await apiClient.get('/announcements', { params });
    return res.data?.data || res.data;
  };

  const createAnnouncement = async (data: { title: string; content: string; audience: string; classId?: string; isPinned?: boolean }) => {
    const res = await apiClient.post('/announcements', data);
    return res.data;
  };

  const updateAnnouncement = async (id: string, data: Partial<{ title: string; content: string; audience: string; classId?: string; isPinned?: boolean }>) => {
    const res = await apiClient.put(`/announcements/${id}`, data);
    return res.data;
  };

  const deleteAnnouncement = async (id: string) => {
    const res = await apiClient.delete(`/announcements/${id}`);
    return res.data;
  };

  const pinAnnouncement = async (id: string, isPinned: boolean) => {
    const res = await apiClient.post(`/announcements/${id}/pin`, { isPinned });
    return res.data;
  };

  return {
    user,
    isAdmin,
    isSuperAdmin,
    isSchoolAdmin,
    fetchStats,
    fetchActivity,
    fetchUsers,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    fetchClasses,
    fetchClassDetails,
    createClass,
    updateClass,
    deleteClass,
    fetchSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    assignTeacherToSubject,
    removeTeacherFromSubject,
    fetchSchedulesForClass,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    fetchComplaints,
    fetchComplaintDetails,
    handleComplaint,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    pinAnnouncement,
  };
}
