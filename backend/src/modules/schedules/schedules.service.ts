import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import {
  CreateScheduleInput,
  UpdateScheduleInput,
  CreateBulkScheduleInput,
} from './schedules.schema';

const defaultInclude = {
  school: { select: { id: true, name: true } },
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

export class ScheduleService {
  /**
   * Find all schedule entries (filtered by classId, dayOfWeek, etc.)
   */
  static async findAll(query: any) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const { classId, dayOfWeek, schoolId, teacherId, subjectId } = query;

    const where: any = {};

    if (classId) where.classId = classId;
    if (dayOfWeek !== undefined && dayOfWeek !== '') {
      where.dayOfWeek = parseInt(dayOfWeek as string, 10);
    }
    if (schoolId) where.schoolId = schoolId;
    if (teacherId) where.teacherId = teacherId;
    if (subjectId) where.subjectId = subjectId;

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        include: defaultInclude,
      }),
      prisma.schedule.count({ where }),
    ]);

    return { schedules, total, page, limit };
  }

  /**
   * Find schedule entry by ID.
   */
  static async findById(id: string) {
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: defaultInclude,
    });

    if (!schedule) {
      throw new ApiError(404, 'SCHEDULE_NOT_FOUND', 'Schedule entry not found');
    }

    return schedule;
  }

  /**
   * Find all schedule entries for a class, grouped by dayOfWeek (0-6).
   */
  static async findByClass(classId: string) {
    const targetClass = await prisma.class.findUnique({ where: { id: classId } });
    if (!targetClass) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    const entries = await prisma.schedule.findMany({
      where: { classId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: defaultInclude,
    });

    const grouped: Record<number, typeof entries> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };

    entries.forEach((entry) => {
      if (grouped[entry.dayOfWeek]) {
        grouped[entry.dayOfWeek].push(entry);
      } else {
        grouped[entry.dayOfWeek] = [entry];
      }
    });

    return {
      classId,
      className: targetClass.name,
      schedule: grouped,
      totalEntries: entries.length,
    };
  }

  /**
   * Create a single schedule entry.
   */
  static async create(data: CreateScheduleInput) {
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    const targetClass = await prisma.class.findUnique({ where: { id: data.classId } });
    if (!targetClass) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    if (data.subjectId) {
      const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
      if (!subject) {
        throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
      }
    }

    if (data.teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: data.teacherId } });
      if (!teacher) {
        throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        schoolId: data.schoolId,
        classId: data.classId,
        subjectId: data.subjectId ?? null,
        teacherId: data.teacherId ?? null,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room ?? null,
        notes: data.notes ?? null,
      },
      include: defaultInclude,
    });

    return schedule;
  }

  /**
   * Update a schedule entry.
   */
  static async update(id: string, data: UpdateScheduleInput) {
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'SCHEDULE_NOT_FOUND', 'Schedule entry not found');
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data,
      include: defaultInclude,
    });

    return updated;
  }

  /**
   * Delete a schedule entry.
   */
  static async delete(id: string) {
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError(404, 'SCHEDULE_NOT_FOUND', 'Schedule entry not found');
    }

    await prisma.schedule.delete({ where: { id } });
    return { id, message: 'Schedule entry deleted successfully' };
  }

  /**
   * Create multiple schedule entries in bulk.
   */
  static async createBulk(data: CreateBulkScheduleInput) {
    const createdSchedules = await prisma.$transaction(
      data.schedules.map((entry) =>
        prisma.schedule.create({
          data: {
            schoolId: entry.schoolId,
            classId: entry.classId,
            subjectId: entry.subjectId ?? null,
            teacherId: entry.teacherId ?? null,
            dayOfWeek: entry.dayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            room: entry.room ?? null,
            notes: entry.notes ?? null,
          },
          include: defaultInclude,
        })
      )
    );

    return createdSchedules;
  }
}
