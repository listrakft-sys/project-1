import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { hashPassword } from '../../utils/password';
import { Prisma } from '@prisma/client';

export interface CreateTeacherInput {
  userId?: string;
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  schoolId: string;
  employeeId?: string;
  qualification?: string;
  specialization?: string;
  joinDate?: string | Date;
  subjectIds?: string[];
}

export interface UpdateTeacherInput {
  schoolId?: string;
  employeeId?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  joinDate?: string | Date;
  subjectIds?: string[];
  firstName?: string;
  lastName?: string;
}

export interface TeacherQueryFilters {
  search?: string;
  schoolId?: string;
  subjectId?: string;
  skip?: number;
  limit?: number;
}

export interface AuthUserContext {
  userId: string;
  role: string;
}

export class TeacherService {
  static async findAll(filters: TeacherQueryFilters) {
    const { search, schoolId, subjectId, skip = 0, limit = 10 } = filters;

    const where: Prisma.TeacherWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (subjectId) {
      where.subjects = {
        some: { id: subjectId },
      };
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { employeeId: { contains: term, mode: 'insensitive' } },
        { specialization: { contains: term, mode: 'insensitive' } },
        { qualification: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { username: { contains: term, mode: 'insensitive' } } },
        { user: { profile: { firstName: { contains: term, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
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
          school: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          subjects: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teacher.count({ where }),
    ]);

    return { teachers, total };
  }

  static async findById(id: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            status: true,
            preferredLang: true,
            profile: true,
          },
        },
        school: true,
        subjects: true,
        lessons: {
          include: {
            class: true,
            subject: true,
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!teacher) {
      throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher record not found');
    }

    return teacher;
  }

  static async create(data: CreateTeacherInput) {
    // 1. Verify target school exists
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'Target school not found');
    }

    let userId = data.userId;

    // 2. Link existing user or create a new user
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const existingTeacher = await prisma.teacher.findUnique({ where: { userId } });
      if (existingTeacher) {
        throw new ApiError(409, 'TEACHER_EXISTS', 'User is already registered as a teacher');
      }

      if (user.role !== 'TEACHER') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'TEACHER' },
        });
      }
    } else if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        userId = existingUser.id;
        const existingTeacher = await prisma.teacher.findUnique({ where: { userId } });
        if (existingTeacher) {
          throw new ApiError(409, 'TEACHER_EXISTS', 'User is already registered as a teacher');
        }

        if (existingUser.role !== 'TEACHER') {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'TEACHER' },
          });
        }
      } else {
        if (!data.firstName || !data.lastName) {
          throw new ApiError(400, 'MISSING_FIELDS', 'firstName and lastName are required when creating a new user');
        }

        const username =
          data.username || data.email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
        const rawPassword = data.password || 'Teacher123!';
        const hashedPassword = await hashPassword(rawPassword);

        const newUser = await prisma.user.create({
          data: {
            email: data.email,
            username,
            password: hashedPassword,
            role: 'TEACHER',
            status: 'ACTIVE',
            profile: {
              create: {
                firstName: data.firstName,
                lastName: data.lastName,
              },
            },
            privacySettings: {
              create: {
                profileVisibility: 'SCHOOL_ONLY',
                whoCanMessage: 'SCHOOL_ONLY',
              },
            },
          },
        });
        userId = newUser.id;
      }
    } else {
      throw new ApiError(400, 'INVALID_INPUT', 'Either userId or email must be provided to create a teacher');
    }

    // 3. Prepare subject relation
    const subjectsConnect =
      data.subjectIds && data.subjectIds.length > 0
        ? { connect: data.subjectIds.map((id) => ({ id })) }
        : undefined;

    // 4. Create Teacher record
    const teacher = await prisma.teacher.create({
      data: {
        userId,
        schoolId: data.schoolId,
        employeeId: data.employeeId,
        qualification: data.qualification,
        specialization: data.specialization,
        joinDate: data.joinDate ? new Date(data.joinDate) : new Date(),
        ...(subjectsConnect ? { subjects: subjectsConnect } : {}),
      },
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
        school: true,
        subjects: true,
      },
    });

    return teacher;
  }

  static async update(id: string, data: UpdateTeacherInput, currentUser?: AuthUserContext) {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher) {
      throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
    }

    if (currentUser) {
      const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(currentUser.role);
      const isSelf = teacher.userId === currentUser.userId;
      if (!isAdmin && !isSelf) {
        throw new ApiError(403, 'FORBIDDEN', 'You can only update your own teacher record');
      }
    }

    if (data.schoolId) {
      const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
      if (!school) throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    if (data.firstName || data.lastName) {
      await prisma.profile.update({
        where: { userId: teacher.userId },
        data: {
          ...(data.firstName ? { firstName: data.firstName } : {}),
          ...(data.lastName ? { lastName: data.lastName } : {}),
        },
      });
    }

    const updateData: Prisma.TeacherUpdateInput = {};

    if (data.schoolId !== undefined) updateData.school = { connect: { id: data.schoolId } };
    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.joinDate !== undefined) updateData.joinDate = new Date(data.joinDate);

    if (data.subjectIds !== undefined) {
      updateData.subjects = {
        set: data.subjectIds.map((subId) => ({ id: subId })),
      };
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
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
        school: true,
        subjects: true,
      },
    });

    return updatedTeacher;
  }

  static async getClasses(teacherId: string) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
    }

    const classes = await prisma.class.findMany({
      where: {
        OR: [
          { homeroomTeacherId: teacherId },
          { lessons: { some: { teacherId } } },
          { schedules: { some: { teacherId } } },
          { homework: { some: { teacherId } } },
        ],
      },
      include: {
        school: {
          select: { id: true, name: true },
        },
        _count: {
          select: { students: true, lessons: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return classes;
  }

  static async getLessons(
    teacherId: string,
    queryFilters?: { classId?: string; subjectId?: string }
  ) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');
    }

    const where: Prisma.LessonWhereInput = { teacherId };

    if (queryFilters?.classId) where.classId = queryFilters.classId;
    if (queryFilters?.subjectId) where.subjectId = queryFilters.subjectId;

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        class: true,
        subject: true,
      },
      orderBy: { startDate: 'desc' },
    });

    return lessons;
  }
}
