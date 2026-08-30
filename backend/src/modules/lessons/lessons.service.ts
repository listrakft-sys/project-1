import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { JwtPayload } from '../../utils/jwt';
import { CreateLessonInput, UpdateLessonInput } from './lessons.schema';

const defaultInclude = {
  class: { select: { id: true, name: true, grade: true, section: true } },
  subject: { select: { id: true, name: true, code: true, color: true } },
  teacher: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          profile: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
    },
  },
};

export class LessonService {
  /**
   * Find all lessons with filtering by classId, teacherId, subjectId, date range, and pagination.
   */
  static async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const { classId, teacherId, subjectId, startDate, endDate, search, status } = query;

    const where: any = {};

    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;
    if (subjectId) where.subjectId = subjectId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [lessons, total] = await Promise.all([
      prisma.lesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
        include: defaultInclude,
      }),
      prisma.lesson.count({ where }),
    ]);

    return { lessons, total, page, limit };
  }

  /**
   * Find lesson by ID with relations.
   */
  static async findById(id: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: defaultInclude,
    });

    if (!lesson) {
      throw new ApiError(404, 'LESSON_NOT_FOUND', 'Lesson not found');
    }

    return lesson;
  }

  /**
   * Create a new lesson.
   */
  static async create(data: CreateLessonInput, _currentUser: JwtPayload) {
    const targetClass = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!targetClass) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    const targetSubject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!targetSubject) {
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
    }

    const targetTeacher = await prisma.teacher.findUnique({ where: { id: data.teacherId } });
    if (!targetTeacher) {
      throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
    }

    const lesson = await prisma.lesson.create({
      data: {
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        title: data.title,
        description: data.description,
        materials: data.materials || [],
        room: data.room,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: defaultInclude,
    });

    return lesson;
  }

  /**
   * Update a lesson (owner teacher or admin).
   */
  static async update(id: string, data: UpdateLessonInput, currentUser: JwtPayload) {
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!existingLesson) {
      throw new ApiError(404, 'LESSON_NOT_FOUND', 'Lesson not found');
    }

    await LessonService.verifyOwnerOrAdmin(existingLesson, currentUser);

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const updated = await prisma.lesson.update({
      where: { id },
      data: updateData,
      include: defaultInclude,
    });

    return updated;
  }

  /**
   * Delete a lesson (owner teacher or admin).
   */
  static async delete(id: string, currentUser: JwtPayload) {
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (!existingLesson) {
      throw new ApiError(404, 'LESSON_NOT_FOUND', 'Lesson not found');
    }

    await LessonService.verifyOwnerOrAdmin(existingLesson, currentUser);

    await prisma.lesson.delete({ where: { id } });
    return { id, message: 'Lesson deleted successfully' };
  }

  /**
   * Get today's lessons for the current user based on their role.
   */
  static async getToday(currentUser: JwtPayload) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const where: any = {
      startDate: {
        gte: startOfToday,
        lte: endOfToday,
      },
    };

    if (currentUser.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });
      if (!student || !student.classId) {
        return [];
      }
      where.classId = student.classId;
    } else if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });
      if (!teacher) {
        return [];
      }
      where.teacherId = teacher.id;
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: defaultInclude,
    });

    return lessons;
  }

  /**
   * Get upcoming lessons for the next 7 days based on user role.
   */
  static async getUpcoming(currentUser: JwtPayload) {
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);

    const where: any = {
      startDate: {
        gte: now,
        lte: in7Days,
      },
    };

    if (currentUser.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });
      if (!student || !student.classId) {
        return [];
      }
      where.classId = student.classId;
    } else if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });
      if (!teacher) {
        return [];
      }
      where.teacherId = teacher.id;
    }

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: defaultInclude,
    });

    return lessons;
  }

  private static async verifyOwnerOrAdmin(lesson: any, currentUser: JwtPayload) {
    if (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'SCHOOL_ADMIN'
    ) {
      return;
    }

    if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (teacher && lesson.teacherId === teacher.id) {
        return;
      }
    }

    throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action on this lesson');
  }
}
