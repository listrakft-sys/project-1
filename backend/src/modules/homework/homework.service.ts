import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';
import { JwtPayload } from '../../utils/jwt';
import {
  CreateHomeworkInput,
  UpdateHomeworkInput,
  SubmitHomeworkInput,
  GradeSubmissionInput,
} from './homework.schema';

export class HomeworkService {
  /**
   * Find all homework with filters for class, subject, student, teacher, or status.
   */
  static async findAll(query: any, currentUser: JwtPayload) {
    const { page, limit, skip } = getPagination({ query });
    const { classId, subjectId, studentId, teacherId, status, search } = query;

    const where: any = {};

    // 1. Role-based restrictions
    if (currentUser.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });
      if (!student || !student.classId) {
        return { data: [], total: 0, page, limit };
      }
      where.classId = student.classId;
    } else if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });
      if (teacher) {
        // Default to teacher's homework unless explicitly filtered
        if (!classId && !subjectId && !teacherId) {
          where.teacherId = teacher.id;
        }
      }
    }

    // 2. Query filters
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (teacherId) where.teacherId = teacherId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Determine target student ID for submissions inclusion
    let targetStudentId = studentId;
    if (!targetStudentId && currentUser.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });
      if (student) targetStudentId = student.id;
    }

    const [homeworkList, total] = await Promise.all([
      prisma.homework.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          class: { select: { id: true, name: true, grade: true, section: true } },
          subject: { select: { id: true, name: true, code: true, color: true } },
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  profile: { select: { firstName: true, lastName: true, avatar: true } },
                },
              },
            },
          },
          submissions: targetStudentId
            ? { where: { studentId: targetStudentId } }
            : false,
        },
      }),
      prisma.homework.count({ where }),
    ]);

    const now = new Date();

    // Map and decorate with submission status if checking for a student
    let data = homeworkList.map((hw) => {
      const submission = hw.submissions?.[0] || null;
      let computedStatus = 'ASSIGNED';

      if (submission) {
        computedStatus = submission.status;
      } else if (now > new Date(hw.dueDate)) {
        computedStatus = 'OVERDUE';
      }

      const { submissions, ...hwWithoutSubmissions } = hw;

      return {
        ...hwWithoutSubmissions,
        ...(targetStudentId ? { submission, status: computedStatus } : {}),
      };
    });

    // If status filter is passed, apply it
    if (status) {
      if (targetStudentId) {
        data = data.filter((item) => item.status === status);
      } else {
        // If checking without a specific student, check submission statuses or query
        data = data.filter((item: any) => item.status === status);
      }
    }

    return { data, total: status ? data.length : total, page, limit };
  }

  /**
   * Find homework by ID.
   * Includes submissions for teachers/admins, just homework + student's submission for students.
   */
  static async findById(id: string, currentUser: JwtPayload) {
    const homework = await prisma.homework.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true, grade: true, section: true } },
        subject: { select: { id: true, name: true, code: true, color: true } },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
        submissions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    profile: { select: { firstName: true, lastName: true, avatar: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!homework) {
      throw new ApiError(404, 'HOMEWORK_NOT_FOUND', 'Homework not found');
    }

    // Role-specific response mapping
    if (currentUser.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!student || homework.classId !== student.classId) {
        throw new ApiError(403, 'FORBIDDEN', 'Access denied to homework outside your class');
      }

      const submission = homework.submissions.find((s) => s.studentId === student.id) || null;
      const now = new Date();
      let status = 'ASSIGNED';
      if (submission) {
        status = submission.status;
      } else if (now > new Date(homework.dueDate)) {
        status = 'OVERDUE';
      }

      const { submissions, ...homeworkData } = homework;
      return {
        ...homeworkData,
        submission,
        status,
      };
    }

    // For Teachers and Admins — return full homework including all submissions
    return homework;
  }

  /**
   * Create new homework (teacher or admin).
   * Teachers must teach the subject and class.
   */
  static async create(data: CreateHomeworkInput, currentUser: JwtPayload) {
    let teacherId: string;

    if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
        include: { subjects: true },
      });

      if (!teacher) {
        throw new ApiError(403, 'NOT_A_TEACHER', 'Teacher profile not found for this user');
      }

      // Verify teacher teaches the subject
      const teachesSubject = teacher.subjects.some((s) => s.id === data.subjectId);
      if (!teachesSubject) {
        // Double-check via Subject model relationship
        const subject = await prisma.subject.findFirst({
          where: {
            id: data.subjectId,
            teachers: { some: { id: teacher.id } },
          },
        });
        if (!subject) {
          throw new ApiError(
            403,
            'SUBJECT_NOT_ASSIGNED',
            'You can only create homework for subjects assigned to you'
          );
        }
      }

      // Verify class exists and belongs to the same school
      const targetClass = await prisma.class.findUnique({
        where: { id: data.classId },
      });

      if (!targetClass) {
        throw new ApiError(404, 'CLASS_NOT_FOUND', 'Target class not found');
      }

      if (targetClass.schoolId !== teacher.schoolId) {
        throw new ApiError(403, 'CLASS_MISMATCH', 'Class does not belong to your school');
      }

      teacherId = teacher.id;
    } else if (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'SCHOOL_ADMIN'
    ) {
      // For Admin, check if class & subject exist
      const targetClass = await prisma.class.findUnique({ where: { id: data.classId } });
      if (!targetClass) {
        throw new ApiError(404, 'CLASS_NOT_FOUND', 'Target class not found');
      }

      const targetSubject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
        include: { teachers: true },
      });
      if (!targetSubject) {
        throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Target subject not found');
      }

      // Check if user is also a teacher, else pick subject's first teacher
      const adminTeacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (adminTeacher) {
        teacherId = adminTeacher.id;
      } else if (targetSubject.teachers.length > 0) {
        teacherId = targetSubject.teachers[0].id;
      } else {
        // Find any teacher in the school
        const schoolTeacher = await prisma.teacher.findFirst({
          where: { schoolId: targetClass.schoolId },
        });
        if (!schoolTeacher) {
          throw new ApiError(
            400,
            'NO_TEACHER_AVAILABLE',
            'No teacher found in school to assign to homework'
          );
        }
        teacherId = schoolTeacher.id;
      }
    } else {
      throw new ApiError(403, 'FORBIDDEN', 'Only teachers and administrators can create homework');
    }

    const homework = await prisma.homework.create({
      data: {
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId,
        title: data.title,
        description: data.description,
        dueDate: new Date(data.dueDate),
        attachments: data.attachments || [],
        maxScore: data.maxScore ?? null,
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    return homework;
  }

  /**
   * Update homework (teacher creator or admin).
   */
  static async update(id: string, data: UpdateHomeworkInput, currentUser: JwtPayload) {
    const homework = await prisma.homework.findUnique({
      where: { id },
    });

    if (!homework) {
      throw new ApiError(404, 'HOMEWORK_NOT_FOUND', 'Homework not found');
    }

    if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!teacher || homework.teacherId !== teacher.id) {
        throw new ApiError(403, 'FORBIDDEN', 'You can only update homework you created');
      }
    } else if (
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.role !== 'SCHOOL_ADMIN'
    ) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions to update homework');
    }

    const updated = await prisma.homework.update({
      where: { id },
      data: {
        ...(data.classId && { classId: data.classId }),
        ...(data.subjectId && { subjectId: data.subjectId }),
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
        ...(data.attachments !== undefined && { attachments: data.attachments }),
        ...(data.maxScore !== undefined && { maxScore: data.maxScore }),
      },
      include: {
        class: { select: { id: true, name: true, grade: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return updated;
  }

  /**
   * Delete homework (teacher creator or admin).
   */
  static async delete(id: string, currentUser: JwtPayload) {
    const homework = await prisma.homework.findUnique({
      where: { id },
    });

    if (!homework) {
      throw new ApiError(404, 'HOMEWORK_NOT_FOUND', 'Homework not found');
    }

    if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!teacher || homework.teacherId !== teacher.id) {
        throw new ApiError(403, 'FORBIDDEN', 'You can only delete homework you created');
      }
    } else if (
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.role !== 'SCHOOL_ADMIN'
    ) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions to delete homework');
    }

    await prisma.homework.delete({
      where: { id },
    });

    return { message: 'Homework deleted successfully' };
  }

  /**
   * Get all submissions for a homework (teacher/admin only).
   */
  static async getSubmissions(homeworkId: string, currentUser: JwtPayload) {
    if (currentUser.role === 'STUDENT' || currentUser.role === 'PARENT') {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only teachers and administrators can view all submissions'
      );
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new ApiError(404, 'HOMEWORK_NOT_FOUND', 'Homework not found');
    }

    if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!teacher || homework.teacherId !== teacher.id) {
        throw new ApiError(
          403,
          'FORBIDDEN',
          'You can only view submissions for your assigned homework'
        );
      }
    }

    const submissions = await prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      include: {
        student: {
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions;
  }

  /**
   * Submit homework (student only).
   * Student can only submit for their own class. Sets status to SUBMITTED (or LATE) and submittedAt to now.
   */
  static async submit(
    homeworkId: string,
    data: SubmitHomeworkInput,
    currentUser: JwtPayload
  ) {
    if (currentUser.role !== 'STUDENT') {
      throw new ApiError(403, 'FORBIDDEN', 'Only students can submit homework');
    }

    const student = await prisma.student.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!student) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student profile not found');
    }

    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
    });

    if (!homework) {
      throw new ApiError(404, 'HOMEWORK_NOT_FOUND', 'Homework not found');
    }

    if (homework.classId !== student.classId) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Students can only submit homework for their own class'
      );
    }

    const now = new Date();
    const isLate = now > new Date(homework.dueDate);
    const status = isLate ? 'LATE' : 'SUBMITTED';

    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId: student.id,
        },
      },
      create: {
        homeworkId,
        studentId: student.id,
        content: data.content || null,
        attachments: data.attachments || [],
        status,
        submittedAt: now,
      },
      update: {
        content: data.content !== undefined ? data.content : undefined,
        attachments: data.attachments !== undefined ? data.attachments : undefined,
        status,
        submittedAt: now,
      },
      include: {
        homework: {
          select: { id: true, title: true, dueDate: true, maxScore: true },
        },
      },
    });

    return submission;
  }

  /**
   * Grade a submission (teacher or admin).
   * Sets status to GRADED, grade, feedback, and gradedAt to now.
   */
  static async gradeSubmission(
    homeworkId: string,
    submissionId: string,
    data: GradeSubmissionInput,
    currentUser: JwtPayload
  ) {
    if (currentUser.role === 'STUDENT' || currentUser.role === 'PARENT') {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only teachers and administrators can grade submissions'
      );
    }

    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: true },
    });

    if (!submission || submission.homeworkId !== homeworkId) {
      throw new ApiError(
        404,
        'SUBMISSION_NOT_FOUND',
        'Submission not found for this homework'
      );
    }

    if (currentUser.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!teacher || submission.homework.teacherId !== teacher.id) {
        throw new ApiError(
          403,
          'FORBIDDEN',
          'You can only grade submissions for your assigned homework'
        );
      }
    }

    if (
      submission.homework.maxScore !== null &&
      submission.homework.maxScore !== undefined &&
      data.grade > submission.homework.maxScore
    ) {
      throw new ApiError(
        400,
        'GRADE_EXCEEDS_MAX',
        `Grade cannot exceed max score of ${submission.homework.maxScore}`
      );
    }

    const now = new Date();

    const updatedSubmission = await prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        grade: data.grade,
        feedback: data.feedback !== undefined ? data.feedback : null,
        status: 'GRADED',
        gradedAt: now,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        homework: {
          select: { id: true, title: true, maxScore: true },
        },
      },
    });

    return updatedSubmission;
  }

  /**
   * Get all homework for a student with their submission status.
   */
  static async getStudentHomework(
    studentId: string,
    query: any,
    currentUser: JwtPayload
  ) {
    if (currentUser.role === 'STUDENT') {
      const currentStudent = await prisma.student.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!currentStudent || currentStudent.id !== studentId) {
        throw new ApiError(403, 'FORBIDDEN', 'You can only view your own homework');
      }
    }

    const targetStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!targetStudent) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
    }

    if (!targetStudent.classId) {
      const { page, limit } = getPagination({ query });
      return { data: [], total: 0, page, limit };
    }

    const { page, limit, skip } = getPagination({ query });
    const where: any = { classId: targetStudent.classId };

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    const [homeworkList, total] = await Promise.all([
      prisma.homework.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          class: { select: { id: true, name: true, grade: true, section: true } },
          subject: { select: { id: true, name: true, code: true, color: true } },
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  profile: { select: { firstName: true, lastName: true, avatar: true } },
                },
              },
            },
          },
          submissions: {
            where: { studentId },
          },
        },
      }),
      prisma.homework.count({ where }),
    ]);

    const now = new Date();

    let data = homeworkList.map((hw) => {
      const submission = hw.submissions[0] || null;
      let status: string;

      if (submission) {
        status = submission.status;
      } else if (now > new Date(hw.dueDate)) {
        status = 'OVERDUE';
      } else {
        status = 'ASSIGNED';
      }

      const { submissions, ...homeworkInfo } = hw;

      return {
        ...homeworkInfo,
        submission,
        submissionStatus: status,
      };
    });

    if (query.status) {
      data = data.filter((item) => item.submissionStatus === query.status);
    }

    return { data, total: query.status ? data.length : total, page, limit };
  }
}
