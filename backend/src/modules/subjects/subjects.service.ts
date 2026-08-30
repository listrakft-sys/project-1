import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';

export class SubjectService {
  static async findAll(query: {
    page?: number;
    limit?: number;
    skip?: number;
    schoolId?: string;
    language?: string;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, skip = 0, schoolId, language, search, sortBy = 'createdAt', sortDir = 'desc' } = query;

    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (language) where.language = { equals: language, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
        include: {
          school: {
            select: { id: true, name: true, logo: true },
          },
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
          _count: {
            select: {
              teachers: true,
              lessons: true,
              homework: true,
            },
          },
        },
      }),
      prisma.subject.count({ where }),
    ]);

    return { subjects, total, page, limit };
  }

  static async findById(id: string) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        school: {
          select: { id: true, name: true, logo: true },
        },
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
        _count: {
          select: {
            teachers: true,
            lessons: true,
            homework: true,
          },
        },
      },
    });

    if (!subject) {
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
    }

    return subject;
  }

  static async create(data: {
    schoolId: string;
    name: string;
    code: string;
    description?: string;
    color?: string;
    language?: string;
  }) {
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    const existingCode = await prisma.subject.findUnique({
      where: {
        schoolId_code: {
          schoolId: data.schoolId,
          code: data.code,
        },
      },
    });

    if (existingCode) {
      throw new ApiError(409, 'SUBJECT_CODE_EXISTS', `Subject code "${data.code}" already exists in this school`);
    }

    const subject = await prisma.subject.create({
      data: {
        schoolId: data.schoolId,
        name: data.name,
        code: data.code,
        description: data.description,
        color: data.color,
        language: data.language,
      },
      include: {
        school: true,
        _count: {
          select: {
            teachers: true,
            lessons: true,
            homework: true,
          },
        },
      },
    });

    return subject;
  }

  static async update(
    id: string,
    data: {
      schoolId?: string;
      name?: string;
      code?: string;
      description?: string | null;
      color?: string | null;
      language?: string | null;
    },
  ) {
    const existingSubject = await prisma.subject.findUnique({ where: { id } });
    if (!existingSubject) {
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
    }

    const targetSchoolId = data.schoolId || existingSubject.schoolId;
    const targetCode = data.code || existingSubject.code;

    if (data.schoolId || data.code) {
      const duplicate = await prisma.subject.findFirst({
        where: {
          schoolId: targetSchoolId,
          code: targetCode,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new ApiError(409, 'SUBJECT_CODE_EXISTS', `Subject code "${targetCode}" already exists in target school`);
      }
    }

    const updated = await prisma.subject.update({
      where: { id },
      data,
      include: {
        school: true,
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
        _count: {
          select: {
            teachers: true,
            lessons: true,
            homework: true,
          },
        },
      },
    });

    return updated;
  }

  static async delete(id: string) {
    const existingSubject = await prisma.subject.findUnique({ where: { id } });
    if (!existingSubject) {
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
    }

    await prisma.subject.delete({ where: { id } });
    return { id };
  }

  static async assignTeacher(subjectId: string, teacherId: string) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        teachers: {
          connect: { id: teacherId },
        },
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

    return updatedSubject;
  }

  static async removeTeacher(subjectId: string, teacherId: string) {
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Subject not found');
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
    }

    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        teachers: {
          disconnect: { id: teacherId },
        },
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

    return updatedSubject;
  }
}
