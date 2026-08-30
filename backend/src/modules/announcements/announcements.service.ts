import { Prisma } from '@prisma/client';
import { logger } from '../../utils/logger';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';
import { JwtPayload } from '../../utils/jwt';
import {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from './announcements.schema';

export class AnnouncementService {
  /**
   * Helper to get school and class IDs associated with a user based on their role.
   */
  private static async getUserContext(userId: string, role: string) {
    let userSchoolId: string | null = null;
    let userClassIds: string[] = [];

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { schoolId: true, classId: true },
      });
      if (student) {
        userSchoolId = student.schoolId;
        if (student.classId) {
          userClassIds.push(student.classId);
        }
      }
    } else if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        select: { id: true, schoolId: true },
      });
      if (teacher) {
        userSchoolId = teacher.schoolId;

        // Find classes where teacher is homeroom teacher
        const homeroomClasses = await prisma.class.findMany({
          where: { homeroomTeacherId: teacher.id },
          select: { id: true },
        });

        // Find classes where teacher teaches lessons
        const lessonClasses = await prisma.lesson.findMany({
          where: { teacherId: teacher.id },
          select: { classId: true },
          distinct: ['classId'],
        });

        const classIdSet = new Set<string>([
          ...homeroomClasses.map((c) => c.id),
          ...lessonClasses.map((l) => l.classId),
        ]);

        userClassIds = Array.from(classIdSet);
      }
    } else if (role === 'SCHOOL_ADMIN') {
      const school = await prisma.school.findFirst({
        where: { adminId: userId },
        select: { id: true },
      });
      if (school) {
        userSchoolId = school.id;
      } else {
        // Check teacher or student record if admin is also registered as teacher/student
        const teacher = await prisma.teacher.findUnique({
          where: { userId },
          select: { schoolId: true },
        });
        if (teacher) userSchoolId = teacher.schoolId;
      }
    }

    return { userSchoolId, userClassIds };
  }

  /**
   * Find all announcements with pagination and filters.
   * Admin sees all or filtered. Non-admin users see announcements relevant to their school/class or 'all'.
   */
  static async findAll(query: any, currentUser: JwtPayload) {
    const { page, limit, skip } = getPagination({ query } as any);
    const { schoolId, classId, audience, search } = query;

    const where: Prisma.AnnouncementWhereInput = {};

    const isAdmin =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SCHOOL_ADMIN';

    // Role-based visibility restrictions for non-admins
    if (!isAdmin) {
      const { userSchoolId, userClassIds } = await this.getUserContext(
        currentUser.userId,
        currentUser.role
      );

      const visibilityConditions: Prisma.AnnouncementWhereInput[] = [
        { audience: 'all' },
      ];

      if (userSchoolId) {
        visibilityConditions.push({ schoolId: userSchoolId });
      }

      if (userClassIds.length > 0) {
        visibilityConditions.push({ classId: { in: userClassIds } });
      }

      where.OR = visibilityConditions;
    }

    // Explicit query filters
    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (classId) {
      where.classId = classId;
    }

    if (audience) {
      where.audience = audience;
    }

    if (search) {
      const searchCondition: Prisma.AnnouncementWhereInput = {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      };

      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchCondition];
        delete where.OR;
      } else {
        where.OR = searchCondition.OR;
      }
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              profile: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
          school: { select: { id: true, name: true } },
          class: { select: { id: true, name: true, grade: true, section: true } },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return { data: announcements, total, page, limit };
  }

  /**
   * Get personalized announcement feed for the current user.
   * Filtered by user's school and class, sorted by isPinned desc then createdAt desc.
   */
  static async getFeed(query: any, currentUser: JwtPayload) {
    const { page, limit, skip } = getPagination({ query } as any);

    const { userSchoolId, userClassIds } = await this.getUserContext(
      currentUser.userId,
      currentUser.role
    );

    const where: Prisma.AnnouncementWhereInput = {};

    if (currentUser.role === 'SUPER_ADMIN') {
      // Super admin sees all in feed
    } else {
      const feedConditions: Prisma.AnnouncementWhereInput[] = [
        { audience: 'all' },
      ];

      if (userSchoolId) {
        feedConditions.push({
          audience: 'school',
          schoolId: userSchoolId,
        });
        feedConditions.push({
          schoolId: userSchoolId,
        });
      }

      if (userClassIds.length > 0) {
        feedConditions.push({
          audience: 'class',
          classId: { in: userClassIds },
        });
      }

      where.OR = feedConditions;
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              profile: {
                select: { firstName: true, lastName: true, avatar: true },
              },
            },
          },
          school: { select: { id: true, name: true } },
          class: { select: { id: true, name: true, grade: true, section: true } },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return { data: announcements, total, page, limit };
  }

  /**
   * Find a single announcement by ID.
   */
  static async findById(id: string, _currentUser: JwtPayload) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, grade: true, section: true } },
      },
    });

    if (!announcement) {
      throw new ApiError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
    }

    return announcement;
  }

  /**
   * Create an announcement.
   * Teachers create for their class; Admins create for school/all or class.
   * Automatically sends Notifications to target users.
   */
  static async create(data: CreateAnnouncementInput, currentUser: JwtPayload) {
    let schoolId = data.schoolId ?? null;
    let classId = data.classId ?? null;
    const audience = data.audience || 'school';

    if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!teacher) {
        throw new ApiError(403, 'NOT_A_TEACHER', 'Teacher profile not found');
      }

      if (audience !== 'class') {
        throw new ApiError(
          403,
          'FORBIDDEN',
          'Teachers can only create announcements for their class'
        );
      }

      if (!classId) {
        throw new ApiError(
          400,
          'CLASS_REQUIRED',
          'Class ID is required for class announcements'
        );
      }

      // Verify class exists and belongs to teacher's school
      const targetClass = await prisma.class.findUnique({
        where: { id: classId },
      });

      if (!targetClass) {
        throw new ApiError(404, 'CLASS_NOT_FOUND', 'Target class not found');
      }

      if (targetClass.schoolId !== teacher.schoolId) {
        throw new ApiError(
          403,
          'CLASS_MISMATCH',
          'Class does not belong to your school'
        );
      }

      schoolId = teacher.schoolId;
    } else if (
      currentUser.role === 'SCHOOL_ADMIN' ||
      currentUser.role === 'SUPER_ADMIN'
    ) {
      if (audience === 'class' && !classId) {
        throw new ApiError(
          400,
          'CLASS_REQUIRED',
          'Class ID is required for class announcements'
        );
      }

      if (!schoolId && currentUser.role === 'SCHOOL_ADMIN') {
        const school = await prisma.school.findFirst({
          where: { adminId: currentUser.userId },
        });
        if (school) {
          schoolId = school.id;
        }
      }

      if (classId) {
        const targetClass = await prisma.class.findUnique({
          where: { id: classId },
        });
        if (!targetClass) {
          throw new ApiError(404, 'CLASS_NOT_FOUND', 'Target class not found');
        }
        if (!schoolId) {
          schoolId = targetClass.schoolId;
        }
      }
    } else {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only teachers and administrators can create announcements'
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        authorId: currentUser.userId,
        title: data.title,
        content: data.content,
        audience,
        schoolId,
        classId,
        attachments: data.attachments || [],
        isPinned: data.isPinned ?? false,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, grade: true, section: true } },
      },
    });

    // Create Notification records for target audience
    try {
      const recipientUserIds = new Set<string>();

      if (audience === 'school' && schoolId) {
        const [students, teachers] = await Promise.all([
          prisma.student.findMany({
            where: { schoolId },
            select: { userId: true },
          }),
          prisma.teacher.findMany({
            where: { schoolId },
            select: { userId: true },
          }),
        ]);

        students.forEach((s) => recipientUserIds.add(s.userId));
        teachers.forEach((t) => recipientUserIds.add(t.userId));
      } else if (audience === 'class' && classId) {
        const students = await prisma.student.findMany({
          where: { classId },
          select: { userId: true },
        });

        students.forEach((s) => recipientUserIds.add(s.userId));
      } else if (audience === 'all') {
        const users = await prisma.user.findMany({
          where: { status: 'ACTIVE' },
          select: { id: true },
        });

        users.forEach((u) => recipientUserIds.add(u.id));
      }

      // Exclude author from receiving their own notification
      recipientUserIds.delete(currentUser.userId);

      if (recipientUserIds.size > 0) {
        const notificationContent =
          data.content.length > 200
            ? data.content.substring(0, 197) + '...'
            : data.content;

        const notifications = Array.from(recipientUserIds).map((userId) => ({
          userId,
          type: 'ANNOUNCEMENT' as const,
          title: `New Announcement: ${data.title}`,
          content: notificationContent,
          data: {
            announcementId: announcement.id,
            audience: announcement.audience,
          },
          link: `/announcements/${announcement.id}`,
        }));

        await prisma.notification.createMany({
          data: notifications,
        });
      }
    } catch (error) {
      // Log notification error but do not fail announcement creation
      logger.error('Failed to create notifications for announcement:', { error: error instanceof Error ? error.message : String(error) });
    }

    return announcement;
  }

  /**
   * Update an announcement. Author or Admin only.
   */
  static async update(
    id: string,
    data: UpdateAnnouncementInput,
    currentUser: JwtPayload
  ) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new ApiError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
    }

    const isAdmin =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SCHOOL_ADMIN';
    const isAuthor = announcement.authorId === currentUser.userId;

    if (!isAuthor && !isAdmin) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only the author or an administrator can update this announcement'
      );
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.audience !== undefined ? { audience: data.audience } : {}),
        ...(data.schoolId !== undefined ? { schoolId: data.schoolId } : {}),
        ...(data.classId !== undefined ? { classId: data.classId } : {}),
        ...(data.attachments !== undefined ? { attachments: data.attachments } : {}),
        ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, grade: true, section: true } },
      },
    });

    return updated;
  }

  /**
   * Delete an announcement. Author or Admin only.
   */
  static async delete(id: string, currentUser: JwtPayload) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new ApiError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
    }

    const isAdmin =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SCHOOL_ADMIN';
    const isAuthor = announcement.authorId === currentUser.userId;

    if (!isAuthor && !isAdmin) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only the author or an administrator can delete this announcement'
      );
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return { success: true, message: 'Announcement deleted successfully' };
  }

  /**
   * Pin or unpin an announcement. Admin only.
   */
  static async pin(id: string, currentUser: JwtPayload) {
    const isAdmin =
      currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SCHOOL_ADMIN';

    if (!isAdmin) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only administrators can pin or unpin announcements'
      );
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new ApiError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found');
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        isPinned: !announcement.isPinned,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
        school: { select: { id: true, name: true } },
        class: { select: { id: true, name: true, grade: true, section: true } },
      },
    });

    return updated;
  }
}
