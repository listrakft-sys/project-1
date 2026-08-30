import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { hashPassword } from '../../utils/password';
import { Prisma } from '@prisma/client';

export interface CreateStudentInput {
  userId?: string;
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  schoolId: string;
  classId?: string | null;
  studentCardId?: string | null;
  enrollmentDate?: string | Date;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
}

export interface UpdateStudentInput {
  schoolId?: string;
  classId?: string | null;
  studentCardId?: string | null;
  enrollmentDate?: string | Date;
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianEmail?: string | null;
  firstName?: string;
  lastName?: string;
}

export interface StudentQueryFilters {
  search?: string;
  schoolId?: string;
  classId?: string;
  skip?: number;
  limit?: number;
}

export interface AuthUserContext {
  userId: string;
  role: string;
}

function sanitizeStudent(student: any, currentUser?: AuthUserContext) {
  if (!student) return student;

  const isSelf = currentUser && currentUser.userId === student.userId;
  const isStaffOrParent =
    currentUser && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT'].includes(currentUser.role);

  // If viewer is another student (not self, not staff/parent), strip guardian info
  if (!isSelf && !isStaffOrParent) {
    const { guardianName, guardianPhone, guardianEmail, ...rest } = student;
    return rest;
  }

  return student;
}

export class StudentService {
  static async findAll(filters: StudentQueryFilters, currentUser?: AuthUserContext) {
    const { search, schoolId, classId, skip = 0, limit = 10 } = filters;

    const where: Prisma.StudentWhereInput = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { studentCardId: { contains: term, mode: 'insensitive' } },
        { guardianName: { contains: term, mode: 'insensitive' } },
        { guardianEmail: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { username: { contains: term, mode: 'insensitive' } } },
        { user: { profile: { firstName: { contains: term, mode: 'insensitive' } } } },
        { user: { profile: { lastName: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
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
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              section: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    const sanitizedStudents = students.map((s) => sanitizeStudent(s, currentUser));

    return { students: sanitizedStudents, total };
  }

  static async findById(id: string, currentUser?: AuthUserContext) {
    const student = await prisma.student.findUnique({
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
        class: true,
      },
    });

    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student record not found');
    }

    return sanitizeStudent(student, currentUser);
  }

  static async create(data: CreateStudentInput) {
    // 1. Verify target school exists
    const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
    if (!school) {
      throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'Target school not found');
    }

    // 2. Verify target class exists if provided
    if (data.classId) {
      const classRecord = await prisma.class.findUnique({ where: { id: data.classId } });
      if (!classRecord) {
        throw new ApiError(404, 'CLASS_NOT_FOUND', 'Target class not found');
      }
    }

    let userId = data.userId;

    // 3. Link existing user or create a new user
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
      }

      const existingStudent = await prisma.student.findUnique({ where: { userId } });
      if (existingStudent) {
        throw new ApiError(409, 'STUDENT_EXISTS', 'User is already registered as a student');
      }

      if (user.role !== 'STUDENT') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'STUDENT' },
        });
      }
    } else if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) {
        userId = existingUser.id;
        const existingStudent = await prisma.student.findUnique({ where: { userId } });
        if (existingStudent) {
          throw new ApiError(409, 'STUDENT_EXISTS', 'User is already registered as a student');
        }

        if (existingUser.role !== 'STUDENT') {
          await prisma.user.update({
            where: { id: userId },
            data: { role: 'STUDENT' },
          });
        }
      } else {
        if (!data.firstName || !data.lastName) {
          throw new ApiError(400, 'MISSING_FIELDS', 'firstName and lastName are required when creating a new user');
        }

        const username =
          data.username || data.email.split('@')[0] + '_' + Math.floor(Math.random() * 10000);
        const rawPassword = data.password || 'Student123!';
        const hashedPassword = await hashPassword(rawPassword);

        const newUser = await prisma.user.create({
          data: {
            email: data.email,
            username,
            password: hashedPassword,
            role: 'STUDENT',
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
      throw new ApiError(400, 'INVALID_INPUT', 'Either userId or email must be provided to create a student');
    }

    // 4. Create Student record
    const student = await prisma.student.create({
      data: {
        userId,
        schoolId: data.schoolId,
        classId: data.classId || null,
        studentCardId: data.studentCardId || null,
        enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : new Date(),
        guardianName: data.guardianName || null,
        guardianPhone: data.guardianPhone || null,
        guardianEmail: data.guardianEmail || null,
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
        class: true,
      },
    });

    return student;
  }

  static async update(id: string, data: UpdateStudentInput, currentUser?: AuthUserContext) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student record not found');
    }

    if (currentUser) {
      const isAdmin = ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(currentUser.role);
      const isSelf = student.userId === currentUser.userId;
      const isParent = currentUser.role === 'PARENT';
      if (!isAdmin && !isSelf && !isParent) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to update this student record');
      }
    }

    if (data.schoolId) {
      const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
      if (!school) throw new ApiError(404, 'SCHOOL_NOT_FOUND', 'School not found');
    }

    if (data.classId) {
      const classRecord = await prisma.class.findUnique({ where: { id: data.classId } });
      if (!classRecord) throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');
    }

    if (data.firstName || data.lastName) {
      await prisma.profile.update({
        where: { userId: student.userId },
        data: {
          ...(data.firstName ? { firstName: data.firstName } : {}),
          ...(data.lastName ? { lastName: data.lastName } : {}),
        },
      });
    }

    const updateData: Prisma.StudentUpdateInput = {};

    if (data.schoolId !== undefined) updateData.school = { connect: { id: data.schoolId } };
    if (data.classId !== undefined) {
      updateData.class = data.classId ? { connect: { id: data.classId } } : { disconnect: true };
    }
    if (data.studentCardId !== undefined) updateData.studentCardId = data.studentCardId;
    if (data.enrollmentDate !== undefined) updateData.enrollmentDate = new Date(data.enrollmentDate);
    if (data.guardianName !== undefined) updateData.guardianName = data.guardianName;
    if (data.guardianPhone !== undefined) updateData.guardianPhone = data.guardianPhone;
    if (data.guardianEmail !== undefined) updateData.guardianEmail = data.guardianEmail;

    const updatedStudent = await prisma.student.update({
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
        class: true,
      },
    });

    return sanitizeStudent(updatedStudent, currentUser);
  }

  static async getHomework(studentId: string, _currentUser?: AuthUserContext) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student record not found');
    }

    if (!student.classId) {
      return [];
    }

    const homeworkList = await prisma.homework.findMany({
      where: { classId: student.classId },
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: { id: true, email: true, profile: true },
            },
          },
        },
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    return homeworkList;
  }

  static async getReports(studentId: string, _currentUser?: AuthUserContext) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student record not found');
    }

    const reports = await prisma.report.findMany({
      where: {
        OR: [
          { studentId },
          { forUserId: student.userId },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reports;
  }
}
