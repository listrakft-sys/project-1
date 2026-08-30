import { PrismaClient, GradeType, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class GradebookService {
  // ── GRADES ──────────────────────────────────────────────

  /**
   * Create a single grade
   */
  static async createGrade(data: {
    studentId: string;
    subjectId: string;
    teacherId: string;
    classId: string;
    lessonId?: string;
    type?: GradeType;
    score: number;
    maxScore?: number;
    weight?: number;
    comment?: string;
    date?: Date;
    term?: string;
  }) {
    // Verify student belongs to class
    const student = await prisma.student.findFirst({
      where: { id: data.studentId, classId: data.classId },
    });
    if (!student) {
      throw { statusCode: 404, errorCode: 'STUDENT_NOT_IN_CLASS', message: 'Student not found in this class' };
    }

    // Verify teacher teaches this subject in this class
    const lesson = await prisma.lesson.findFirst({
      where: { classId: data.classId, subjectId: data.subjectId, teacherId: data.teacherId },
    });
    if (!lesson) {
      throw { statusCode: 403, errorCode: 'TEACHER_NOT_ASSIGNED', message: 'Teacher not assigned to this subject/class' };
    }

    return prisma.grade.create({
      data: {
        studentId: data.studentId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        classId: data.classId,
        lessonId: data.lessonId,
        type: data.type || GradeType.WRITTEN,
        score: data.score,
        maxScore: data.maxScore || 10,
        weight: data.weight || 1.0,
        comment: data.comment,
        date: data.date || new Date(),
        term: data.term || '1',
      },
      include: {
        student: { include: { user: { select: { username: true }, profile: true } } },
        subject: true,
      },
    });
  }

  /**
   * Bulk create grades (for class-wide grading)
   */
  static async bulkCreateGrades(grades: Array<{
    studentId: string;
    subjectId: string;
    teacherId: string;
    classId: string;
    type?: GradeType;
    score: number;
    maxScore?: number;
    weight?: number;
    comment?: string;
    term?: string;
  }>) {
    // Verify all students belong to the class
    const classId = grades[0]?.classId;
    if (!classId) throw { statusCode: 400, errorCode: 'NO_GRADES', message: 'No grades provided' };

    const studentIds = [...new Set(grades.map(g => g.studentId))];
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds }, classId },
      select: { id: true },
    });
    if (students.length !== studentIds.length) {
      throw { statusCode: 400, errorCode: 'STUDENT_NOT_IN_CLASS', message: 'Some students not found in class' };
    }

    return prisma.grade.createMany({
      data: grades.map(g => ({
        studentId: g.studentId,
        subjectId: g.subjectId,
        teacherId: g.teacherId,
        classId: g.classId,
        type: g.type || GradeType.WRITTEN,
        score: g.score,
        maxScore: g.maxScore || 10,
        weight: g.weight || 1.0,
        comment: g.comment,
        term: g.term || '1',
      })),
    });
  }

  /**
   * Get grades for a student (optionally filtered by subject/term)
   */
  static async getStudentGrades(
    studentId: string,
    filters: { subjectId?: string; term?: string; type?: GradeType }
  ) {
    return prisma.grade.findMany({
      where: {
        studentId,
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.term && { term: filters.term }),
        ...(filters.type && { type: filters.type }),
      },
      include: {
        subject: true,
        teacher: { include: { user: { select: { username: true }, profile: true } } },
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get grades for a class (for teacher's gradebook view)
   */
  static async getClassGrades(
    classId: string,
    filters: { subjectId?: string; term?: string; date?: string }
  ) {
    return prisma.grade.findMany({
      where: {
        classId,
        ...(filters.subjectId && { subjectId: filters.subjectId }),
        ...(filters.term && { term: filters.term }),
      },
      include: {
        student: { include: { user: { select: { username: true }, profile: true } } },
        subject: true,
      },
      orderBy: [{ date: 'desc' }, { student: { user: { username: 'asc' } } }],
    });
  }

  /**
   * Update a grade
   */
  static async updateGrade(gradeId: string, teacherId: string, data: {
    score?: number;
    maxScore?: number;
    weight?: number;
    comment?: string;
    type?: GradeType;
    term?: string;
  }) {
    const grade = await prisma.grade.findFirst({
      where: { id: gradeId, teacherId },
    });
    if (!grade) {
      throw { statusCode: 404, errorCode: 'GRADE_NOT_FOUND', message: 'Grade not found or not owned' };
    }

    return prisma.grade.update({
      where: { id: gradeId },
      data,
      include: { subject: true, student: { include: { profile: true } } },
    });
  }

  /**
   * Delete a grade
   */
  static async deleteGrade(gradeId: string, teacherId: string) {
    const grade = await prisma.grade.findFirst({
      where: { id: gradeId, teacherId },
    });
    if (!grade) {
      throw { statusCode: 404, errorCode: 'GRADE_NOT_FOUND', message: 'Grade not found or not owned' };
    }

    await prisma.grade.delete({ where: { id: gradeId } });
    return { deleted: true };
  }

  /**
   * Calculate student's average for a subject (weighted)
   */
  static async getStudentAverage(studentId: string, subjectId?: string, term?: string) {
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        ...(subjectId && { subjectId }),
        ...(term && { term }),
      },
      select: { score: true, maxScore: true, weight: true, type: true, subjectId: true },
    });

    if (grades.length === 0) return { average: null, count: 0 };

    // Group by subject
    const bySubject: Record<string, { totalWeight: number; weightedScore: number }> = {};
    for (const g of grades) {
      if (!bySubject[g.subjectId]) {
        bySubject[g.subjectId] = { totalWeight: 0, weightedScore: 0 };
      }
      const normalized = (g.score / g.maxScore) * 100; // normalize to 0-100
      bySubject[g.subjectId].totalWeight += g.weight;
      bySubject[g.subjectId].weightedScore += normalized * g.weight;
    }

    const subjects = Object.entries(bySubject).map(([subjId, data]) => ({
      subjectId: subjId,
      average: data.totalWeight > 0 ? Math.round((data.weightedScore / data.totalWeight) * 100) / 100 : 0,
    }));

    const overallAvg = subjects.reduce((sum, s) => sum + s.average, 0) / (subjects.length || 1);

    return {
      overallAverage: Math.round(overallAvg * 100) / 100,
      subjects,
      totalGrades: grades.length,
    };
  }

  // ── ATTENDANCE ──────────────────────────────────────────

  /**
   * Mark attendance for a single student
   */
  static async markAttendance(data: {
    studentId: string;
    classId: string;
    subjectId?: string;
    teacherId?: string;
    lessonId?: string;
    status: AttendanceStatus;
    date?: Date;
    note?: string;
  }) {
    // Upsert: unique constraint on [studentId, date, classId]
    return prisma.attendance.upsert({
      where: {
        studentId_date_classId: {
          studentId: data.studentId,
          date: data.date || new Date(),
          classId: data.classId,
        },
      },
      create: {
        studentId: data.studentId,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        lessonId: data.lessonId,
        status: data.status,
        date: data.date || new Date(),
        note: data.note,
      },
      update: {
        status: data.status,
        note: data.note,
      },
    });
  }

  /**
   * Bulk mark attendance for entire class
   */
  static async bulkMarkAttendance(records: Array<{
    studentId: string;
    classId: string;
    subjectId?: string;
    teacherId?: string;
    status: AttendanceStatus;
    date?: Date;
    note?: string;
  }>) {
    const results: Array<{ studentId: string; status: string; success: boolean }> = [];

    for (const record of records) {
      try {
        await prisma.attendance.upsert({
          where: {
            studentId_date_classId: {
              studentId: record.studentId,
              date: record.date || new Date(),
              classId: record.classId,
            },
          },
          create: {
            studentId: record.studentId,
            classId: record.classId,
            subjectId: record.subjectId,
            teacherId: record.teacherId,
            status: record.status,
            date: record.date || new Date(),
            note: record.note,
          },
          update: {
            status: record.status,
            note: record.note,
          },
        });
        results.push({ studentId: record.studentId, status: record.status, success: true });
      } catch {
        results.push({ studentId: record.studentId, status: record.status, success: false });
      }
    }

    return { marked: results.filter(r => r.success).length, total: records.length, results };
  }

  /**
   * Get attendance for a student
   */
  static async getStudentAttendance(
    studentId: string,
    filters: { classId?: string; date?: string; status?: AttendanceStatus }
  ) {
    return prisma.attendance.findMany({
      where: {
        studentId,
        ...(filters.classId && { classId: filters.classId }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get attendance for a class on a specific date
   */
  static async getClassAttendance(classId: string, date: Date) {
    const [attendance, students] = await Promise.all([
      prisma.attendance.findMany({
        where: { classId, date },
        include: { subject: true },
      }),
      prisma.student.findMany({
        where: { classId },
        include: { user: { select: { username: true }, profile: true } },
        orderBy: { user: { username: 'asc' } },
      }),
    ]);

    // Map attendance records to students
    const attendanceMap = new Map(attendance.map(a => [a.studentId, a]));
    return students.map(student => ({
      student,
      attendance: attendanceMap.get(student.id) || null,
    }));
  }

  /**
   * Get attendance summary for a student
   */
  static async getAttendanceSummary(studentId: string, term?: string) {
    const records = await prisma.attendance.findMany({
      where: { studentId },
      select: { status: true, date: true },
    });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      excused: records.filter(r => r.status === 'EXCUSED').length,
      earlyLeave: records.filter(r => r.status === 'EARLY_LEAVE').length,
    };

    const attendanceRate = summary.total > 0
      ? Math.round(((summary.present + summary.late) / summary.total) * 10000) / 100
      : 0;

    return { ...summary, attendanceRate };
  }

  /**
   * Get class gradebook overview (for teachers)
   */
  static async getClassOverview(classId: string, subjectId: string, term: string) {
    const [students, grades, attendance] = await Promise.all([
      prisma.student.findMany({
        where: { classId },
        include: { user: { select: { username: true }, profile: true } },
        orderBy: { user: { username: 'asc' } },
      }),
      prisma.grade.findMany({
        where: { classId, subjectId, term },
        orderBy: { date: 'asc' },
      }),
      prisma.attendance.findMany({
        where: { classId, subjectId },
      }),
    ]);

    // Build per-student summary
    return students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const studentAttendance = attendance.filter(a => a.studentId === student.id);

      const weightedAvg = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * g.weight, 0) /
          studentGrades.reduce((sum, g) => sum + g.weight, 0) * 100
        : null;

      return {
        student,
        grades: studentGrades,
        average: weightedAvg ? Math.round(weightedAvg * 100) / 100 : null,
        attendance: {
          present: studentAttendance.filter(a => a.status === 'PRESENT').length,
          absent: studentAttendance.filter(a => a.status === 'ABSENT').length,
          late: studentAttendance.filter(a => a.status === 'LATE').length,
          total: studentAttendance.length,
        },
      };
    });
  }
}
