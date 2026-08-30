import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';

export class AdminService {
  /**
   * Get dashboard statistics for admin overview
   */
  static async getStats(schoolId?: string) {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      pendingComplaints,
      totalLessons,
      totalAnnouncements,
      activeSchedules,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.student.count({ where: schoolId ? { class: { schoolId } } : {} }),
      prisma.teacher.count({ where: schoolId ? { schoolId } : {} }),
      prisma.class.count({ where: schoolId ? { schoolId } : {} }),
      prisma.subject.count({ where: schoolId ? { schoolId } : {} }),
      prisma.complaint.count({ where: { status: 'PENDING' } }),
      prisma.lesson.count({ where: schoolId ? { class: { schoolId } } : {} }),
      prisma.announcement.count(),
      prisma.schedule.count({ where: schoolId ? { schoolId } : {} }),
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      newUsersThisWeek,
      newComplaintsThisWeek,
      newAnnouncementsThisWeek,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.complaint.count({ where: { status: 'PENDING', createdAt: { gte: sevenDaysAgo } } }),
      prisma.announcement.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    // Attendance rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await prisma.attendance.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { status: true },
    });

    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const attendanceRate = attendanceRecords.length > 0
      ? Math.round((present / attendanceRecords.length) * 100)
      : 0;

    // Grade average
    const grades = await prisma.grade.findMany({
      select: { score: true, maxScore: true },
    });
    const gradeAverage = grades.length > 0
      ? Math.round((grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length) * 100) / 100
      : 0;

    return {
      totals: {
        users: totalUsers,
        students: totalStudents,
        teachers: totalTeachers,
        classes: totalClasses,
        subjects: totalSubjects,
        lessons: totalLessons,
        announcements: totalAnnouncements,
        schedules: activeSchedules,
        pendingComplaints,
      },
      thisWeek: {
        newUsers: newUsersThisWeek,
        newComplaints: newComplaintsThisWeek,
        newAnnouncements: newAnnouncementsThisWeek,
      },
      metrics: {
        attendanceRate,
        gradeAverage,
      },
    };
  }

  /**
   * Get recent users (for admin dashboard)
   */
  static async getRecentUsers(limit = 10) {
    return prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: true,
      },
    });
  }

  /**
   * Get system activity log (recent events)
   */
  static async getActivityLog(limit = 20) {
    const [recentUsers, recentComplaints, recentAnnouncements, recentGrades] = await Promise.all([
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, role: true, createdAt: true },
      }),
      prisma.complaint.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, description: true, status: true, createdAt: true },
      }),
      prisma.announcement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, audience: true, createdAt: true },
      }),
      prisma.grade.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        select: { id: true, score: true, maxScore: true, date: true, student: { select: { user: { select: { username: true } } } } },
      }),
    ]);

    return [
      ...recentUsers.map(u => ({ type: 'USER_REGISTERED', id: u.id, label: u.username, detail: u.role, time: u.createdAt })),
      ...recentComplaints.map(c => ({ type: 'COMPLAINT', id: c.id, label: c.description.slice(0, 50), detail: c.status, time: c.createdAt })),
      ...recentAnnouncements.map(a => ({ type: 'ANNOUNCEMENT', id: a.id, label: a.title, detail: a.audience, time: a.createdAt })),
      ...recentGrades.map(g => ({ type: 'GRADE', id: g.id, label: g.student?.user?.username || 'Student', detail: `${g.score}/${g.maxScore}`, time: g.date })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, limit);
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(userId: string, role: string, adminId: string) {
    const validRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, 'INVALID_ROLE', `Role must be one of: ${validRoles.join(', ')}`);
    }

    // Prevent self-demotion for super_admin
    if (userId === adminId && role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'SELF_DEMOTE', 'You cannot demote yourself');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, username: true, email: true, role: true, status: true },
    });

    return updated;
  }

  /**
   * Update user status (block/unblock/activate)
   */
  static async updateUserStatus(userId: string, status: string, adminId: string) {
    const validStatuses = ['ACTIVE', 'BLOCKED', 'SUSPENDED', 'PENDING'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, 'INVALID_STATUS', `Status must be one of: ${validStatuses.join(', ')}`);
    }

    if (userId === adminId && status !== 'ACTIVE') {
      throw new ApiError(403, 'SELF_BLOCK', 'You cannot block or suspend yourself');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: { id: true, username: true, email: true, role: true, status: true },
    });

    return updated;
  }
}
