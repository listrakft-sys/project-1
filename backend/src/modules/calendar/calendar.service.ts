import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { logger } from '../../utils/logger';
import { JwtPayload } from '../../utils/jwt';

export interface CreateEventInput {
  title: string;
  description?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  schoolId?: string;
  classId?: string;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
}

export class CalendarService {
  static async getUserContext(userId: string, role: string) {
    let schoolId: string | null = null;
    let classIds: string[] = [];

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { schoolId: true, classId: true },
      });
      if (student) {
        schoolId = student.schoolId;
        if (student.classId) classIds.push(student.classId);
      }
    } else if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        select: { id: true, schoolId: true },
      });
      if (teacher) {
        schoolId = teacher.schoolId;
        const homeroomClasses = await prisma.class.findMany({
          where: { homeroomTeacherId: teacher.id },
          select: { id: true },
        });
        const lessonClasses = await prisma.lesson.findMany({
          where: { teacherId: teacher.id },
          select: { classId: true },
          distinct: ['classId'],
        });
        classIds = [...new Set([...homeroomClasses.map(c => c.id), ...lessonClasses.map(l => l.classId)])];
      }
    } else if (role === 'PARENT') {
      const parentLinks = await prisma.parentStudent.findMany({
        where: { parentId: userId },
        include: { student: { select: { schoolId: true, classId: true } } },
      });
      parentLinks.forEach(link => {
        if (link.student?.schoolId) schoolId = link.student.schoolId;
        if (link.student?.classId) classIds.push(link.student.classId);
      });
    } else if (role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') {
      // Admins see all events for their school
      if (role === 'SCHOOL_ADMIN') {
        const adminUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
        const school = await prisma.school.findFirst({ where: { adminId: userId }, select: { id: true } });
        if (school) schoolId = school.id;
      }
    }

    return { schoolId, classIds };
  }

  static async getEvents(user: JwtPayload, query: {
    from?: string;
    to?: string;
    type?: string;
    classId?: string;
  }) {
    const { schoolId, classIds } = await this.getUserContext(user.userId, user.role);

    const where: Record<string, unknown> = {};

    // Date range filter
    if (query.from || query.to) {
      where.startDate = {};
      if (query.from) (where.startDate as Record<string, unknown>).gte = new Date(query.from);
      if (query.to) (where.startDate as Record<string, unknown>).lte = new Date(query.to);
    }

    // Type filter
    if (query.type) where.type = query.type;

    // Role-based scoping
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      // See school-wide events + own class events
      where.OR = [
        { classId: { in: classIds } },
        { classId: null, schoolId: schoolId },
        { classId: null, schoolId: null },
      ];
    } else if (user.role === 'TEACHER') {
      // See events for classes they teach + school-wide
      if (query.classId) {
        where.classId = query.classId;
      } else {
        where.OR = [
          { classId: { in: classIds } },
          { classId: null, schoolId: schoolId },
          { classId: null, schoolId: null },
        ];
      }
    }
    // ADMIN sees all

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return events;
  }

  static async getEventById(id: string) {
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!event) throw new ApiError(404, 'NOT_FOUND', 'Event not found');
    return event;
  }

  static async createEvent(user: JwtPayload, data: CreateEventInput) {
    const event = await prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: data.type || 'EVENT',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location || null,
        schoolId: data.schoolId || null,
        classId: data.classId || null,
        createdBy: user.userId,
      },
    });
    logger.info(`Calendar event created: ${event.id} by ${user.userId}`);
    return event;
  }

  static async updateEvent(user: JwtPayload, id: string, data: UpdateEventInput) {
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Event not found');

    // Only creator or admin can update
    if (existing.createdBy !== user.userId && user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'FORBIDDEN', 'You can only edit your own events');
    }

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.location !== undefined) updateData.location = data.location;

    const event = await prisma.calendarEvent.update({ where: { id }, data: updateData });
    logger.info(`Calendar event updated: ${id} by ${user.userId}`);
    return event;
  }

  static async deleteEvent(user: JwtPayload, id: string) {
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Event not found');

    if (existing.createdBy !== user.userId && user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'FORBIDDEN', 'You can only delete your own events');
    }

    await prisma.calendarEvent.delete({ where: { id } });
    logger.info(`Calendar event deleted: ${id} by ${user.userId}`);
    return { success: true };
  }
}
