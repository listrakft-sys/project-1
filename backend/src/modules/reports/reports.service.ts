import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';
import { JwtPayload } from '../../utils/jwt';
import { CreateReportInput, UpdateReportInput } from './reports.schema';
import { ReportType } from '@prisma/client';

export class ReportService {
  static async findAll(query: any, user: JwtPayload) {
    const { page, limit, skip } = getPagination({ query } as any);

    const where: any = {};

    if (query.type) {
      where.type = query.type as ReportType;
    }
    if (query.studentId) {
      where.studentId = query.studentId;
    }
    if (query.classId) {
      where.classId = query.classId;
    }
    if (query.schoolId) {
      where.schoolId = query.schoolId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.period) {
      where.period = query.period;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search as string, mode: 'insensitive' } },
        { content: { contains: query.search as string, mode: 'insensitive' } },
      ];
    }

    // Role-based visibility scoping
    if (user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: user.userId } });
      where.OR = [
        { forUserId: user.userId },
        ...(student ? [{ studentId: student.id }] : []),
      ];
    } else if (user.role === 'PARENT') {
      where.forUserId = user.userId;
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, email: true, username: true, role: true, profile: true },
          },
          student: {
            include: {
              user: {
                select: { id: true, email: true, username: true, profile: true },
              },
            },
          },
          forUser: {
            select: { id: true, email: true, username: true, profile: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return { data: reports, total, page, limit };
  }

  static async findById(id: string, user: JwtPayload) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, email: true, username: true, role: true, profile: true },
        },
        student: {
          include: {
            user: {
              select: { id: true, email: true, username: true, profile: true },
            },
          },
        },
        forUser: {
          select: { id: true, email: true, username: true, profile: true },
        },
      },
    });

    if (!report) {
      throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
    }

    // Access control: Admins, creator, target student/user
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN';
    const isCreator = report.createdById === user.userId;
    const isTargetUser = report.forUserId === user.userId;
    const isStudentTarget = report.student?.userId === user.userId;

    if (!isAdmin && !isCreator && !isTargetUser && !isStudentTarget && user.role !== 'TEACHER') {
      throw new ApiError(403, 'FORBIDDEN', 'Access denied to this report');
    }

    return report;
  }

  static async create(data: CreateReportInput, user: JwtPayload) {
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN';
    const isTeacher = user.role === 'TEACHER';

    if (!isAdmin && !isTeacher) {
      throw new ApiError(403, 'FORBIDDEN', 'Only teachers and administrators can create reports');
    }

    // Teachers can only create ACADEMIC or PROGRESS reports
    if (isTeacher && !['ACADEMIC', 'PROGRESS'].includes(data.type)) {
      throw new ApiError(403, 'TEACHER_REPORT_RESTRICTION', 'Teachers can only create ACADEMIC or PROGRESS reports');
    }

    // Validate student existence if studentId provided
    if (data.studentId) {
      const student = await prisma.student.findUnique({ where: { id: data.studentId } });
      if (!student) {
        throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student specified in report not found');
      }
    }

    const report = await prisma.report.create({
      data: {
        type: data.type,
        studentId: data.studentId,
        classId: data.classId,
        // schoolId removed — not in Report model
        createdById: user.userId,
        forUserId: data.forUserId,
        title: data.title,
        content: data.content,
        data: data.data,
        period: data.period,
        status: data.status || 'draft',
      },
      include: {
        createdBy: {
          select: { id: true, email: true, username: true, role: true, profile: true },
        },
        student: {
          include: {
            user: {
              select: { id: true, email: true, username: true, profile: true },
            },
          },
        },
        forUser: {
          select: { id: true, email: true, username: true, profile: true },
        },
      },
    });

    return report;
  }

  static async update(id: string, data: UpdateReportInput, user: JwtPayload) {
    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
    }

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN';
    const isCreator = report.createdById === user.userId;

    if (!isAdmin && !isCreator) {
      throw new ApiError(403, 'FORBIDDEN', 'Only administrators or the report author can update this report');
    }

    if (user.role === 'TEACHER' && data.type && !['ACADEMIC', 'PROGRESS'].includes(data.type)) {
      throw new ApiError(403, 'TEACHER_REPORT_RESTRICTION', 'Teachers can only set ACADEMIC or PROGRESS report types');
    }

    const updated = await prisma.report.update({
      where: { id },
      data: ({
        ...(data.type !== undefined && { type: data.type }),
        ...(data.studentId !== undefined && { studentId: data.studentId || undefined }),
        ...(data.classId !== undefined && { classId: data.classId }),
        ...(data.forUserId !== undefined && { forUserId: data.forUserId }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.data !== undefined && { data: data.data }),
        ...(data.period !== undefined && { period: data.period }),
        ...(data.status !== undefined && { status: data.status }),
      }) as any,
      include: {
        createdBy: {
          select: { id: true, email: true, username: true, role: true, profile: true },
        },
        student: {
          include: {
            user: {
              select: { id: true, email: true, username: true, profile: true },
            },
          },
        },
        forUser: {
          select: { id: true, email: true, username: true, profile: true },
        },
      },
    });

    return updated;
  }

  static async delete(id: string, user: JwtPayload) {
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN';
    if (!isAdmin) {
      throw new ApiError(403, 'FORBIDDEN', 'Only administrators can delete reports');
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new ApiError(404, 'REPORT_NOT_FOUND', 'Report not found');
    }

    await prisma.report.delete({ where: { id } });
  }

  static async findByStudentId(studentId: string, query: any, user: JwtPayload) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
    }

    return this.findAll({ ...query, studentId }, user);
  }
}
