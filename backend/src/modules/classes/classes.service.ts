import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';

export class ClassService {
  static async findAll(query: {
    page?: number;
    limit?: number;
    skip?: number;
    schoolId?: string;
    grade?: number;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, skip = 0, schoolId, grade, search, sortBy = 'createdAt', sortDir = 'desc' } = query;

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (grade !== undefined && !isNaN(grade)) where.grade = grade;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { section: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy === 'grade' ? [{ grade: sortDir }, { name: 'asc' }] : { [sortBy]: sortDir },
        include: {
          school: {
            select: { id: true, name: true, logo: true },
          },
          _count: {
            select: {
              students: true,
              lessons: true,
              homework: true,
              announcements: true,
            },
          },
        },
      }),
      prisma.class.count({ where }),
    ]);

    return { classes, total, page, limit };
  }

  static async findById(id: string) {
    const classRecord = await prisma.class.findUnique({
      where: { id },
      include: {
        school: {
          select: { id: true, name: true, address: true, logo: true },
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
                profile: true,
              },
            },
          },
        },
        announcements: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            students: true,
            lessons: true,
            homework: true,
            announcements: true,
            schedules: true,
          },
        },
      },
    });

    if (!classRecord) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    // Fetch related subjects in the school
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: classRecord.schoolId,
      },
      include: {
        teachers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    return {
      ...classRecord,
      subjects,
    };
  }

  static async create(data: {
    schoolId: string;
    name: string;
    grade: number;
    section?: string;
    capacity?: number;
    room?: string;
    homeroomTeacherId?: string | null;
  }) {
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    const existing = await prisma.class.findUnique({
      where: {
        schoolId_name: {
          schoolId: data.schoolId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new ApiError(409, 'CLASS_EXISTS', `Class with name "${data.name}" already exists in this school`);
    }

    if (data.homeroomTeacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: data.homeroomTeacherId } });
      if (!teacher) {
        throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
      }
    }

    const newClass = await prisma.class.create({
      data: {
        schoolId: data.schoolId,
        name: data.name,
        grade: data.grade,
        section: data.section,
        capacity: data.capacity,
        room: data.room,
        homeroomTeacherId: data.homeroomTeacherId || null,
      },
      include: {
        school: true,
        _count: {
          select: {
            students: true,
            lessons: true,
            homework: true,
          },
        },
      },
    });

    return newClass;
  }

  static async update(
    id: string,
    data: {
      schoolId?: string;
      name?: string;
      grade?: number;
      section?: string | null;
      capacity?: number | null;
      room?: string | null;
      homeroomTeacherId?: string | null;
    },
  ) {
    const existingClass = await prisma.class.findUnique({ where: { id } });
    if (!existingClass) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    const targetSchoolId = data.schoolId || existingClass.schoolId;
    const targetName = data.name || existingClass.name;

    if (data.schoolId || data.name) {
      const duplicate = await prisma.class.findFirst({
        where: {
          schoolId: targetSchoolId,
          name: targetName,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ApiError(409, 'CLASS_EXISTS', `Class with name "${targetName}" already exists in target school`);
      }
    }

    if (data.homeroomTeacherId && data.homeroomTeacherId !== existingClass.homeroomTeacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: data.homeroomTeacherId } });
      if (!teacher) {
        throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
      }
    }

    const updated = await prisma.class.update({
      where: { id },
      data,
      include: {
        school: true,
        _count: {
          select: {
            students: true,
            lessons: true,
            homework: true,
          },
        },
      },
    });

    return updated;
  }

  static async delete(id: string) {
    const existingClass = await prisma.class.findUnique({ where: { id } });
    if (!existingClass) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    await prisma.class.delete({ where: { id } });
    return { id };
  }

  static async assignStudent(classId: string, studentId: string) {
    const classRecord = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRecord) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
    }

    if (classRecord.capacity) {
      const studentCount = await prisma.student.count({ where: { classId } });
      if (studentCount >= classRecord.capacity) {
        throw new ApiError(400, 'CLASS_FULL', 'Class has reached maximum capacity');
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        classId,
        schoolId: classRecord.schoolId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: true,
          },
        },
        class: true,
      },
    });

    return updatedStudent;
  }

  static async removeStudent(classId: string, studentId: string) {
    const classRecord = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRecord) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
    }

    if (student.classId !== classId) {
      throw new ApiError(400, 'STUDENT_NOT_IN_CLASS', 'Student is not assigned to this class');
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: { classId: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: true,
          },
        },
      },
    });

    return updatedStudent;
  }

  static async getStudents(
    classId: string,
    query: { page?: number; limit?: number; skip?: number; search?: string },
  ) {
    const classRecord = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRecord) {
      throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    const { limit = 10, skip = 0, page = 1, search } = query;
    const where: any = { classId };

    if (search) {
      where.user = {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { firstName: { contains: search, mode: 'insensitive' } } },
          { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              status: true,
              profile: true,
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return { students, total, page, limit };
  }
}
