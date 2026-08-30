import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';

export class ParentChatService {
  /**
   * Link a parent (User with role=PARENT) to a student.
   * Only admins or the parent themselves can create this link.
   */
  static async linkChild(parentUserId: string, studentId: string, relationship?: string, isPrimary = false) {
    const parent = await prisma.user.findUnique({
      where: { id: parentUserId },
      select: { id: true, role: true },
    });
    if (!parent) throw new ApiError(404, 'USER_NOT_FOUND', 'Parent user not found');
    if (parent.role !== 'PARENT') {
      throw new ApiError(400, 'NOT_PARENT', 'Target user is not a parent');
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: { select: { name: true } }, user: { select: { username: true, profile: true } } },
    });
    if (!student) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');

    const existing = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parentUserId, studentId } },
    });
    if (existing) {
      return { link: existing, student, alreadyLinked: true };
    }

    const link = await prisma.parentStudent.create({
      data: { parentId: parentUserId, studentId, relationship, isPrimary },
    });

    return { link, student, alreadyLinked: false };
  }

  /**
   * Get all children linked to a parent.
   */
  static async getChildren(parentUserId: string) {
    const links = await prisma.parentStudent.findMany({
      where: { parentId: parentUserId },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, username: true, profile: { select: { firstName: true, lastName: true, avatar: true } } },
            },
            class: { select: { id: true, name: true, homeroomTeacherId: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return links.map(l => ({
      linkId: l.id,
      relationship: l.relationship,
      isPrimary: l.isPrimary,
      studentId: l.student.id,
      studentName: l.student.user.profile
        ? `${l.student.user.profile.firstName} ${l.student.user.profile.lastName}`
        : l.student.user.username,
      classId: l.student.classId,
      className: l.student.class?.name,
      homeroomTeacherId: l.student.class?.homeroomTeacherId,
    }));
  }

  /**
   * Get all teachers for a parent's children (for starting chats).
   */
  static async getTeachersForParent(parentUserId: string) {
    const children = await prisma.parentStudent.findMany({
      where: { parentId: parentUserId },
      select: { studentId: true },
    });

    if (children.length === 0) return [];

    const studentIds = children.map(c => c.studentId);

    // Get classes of these students
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, classId: true, class: { select: { name: true } }, user: { select: { profile: true, username: true } } },
    });

    const classIds = students.map(s => s.classId).filter(Boolean) as string[];

    // Get lessons for these classes → teacher IDs
    const lessons = await prisma.lesson.findMany({
      where: { classId: { in: classIds } },
      select: { teacherId: true, subjectId: true, subject: { select: { name: true, code: true } } },
    });

    // Also get homeroom teachers
    const classes = await prisma.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, homeroomTeacherId: true },
    });

    // Collect unique teacher IDs
    const teacherIds = new Set<string>();
    lessons.forEach(l => teacherIds.add(l.teacherId));
    classes.forEach(c => { if (c.homeroomTeacherId) teacherIds.add(c.homeroomTeacherId); });

    if (teacherIds.size === 0) return [];

    const teachers = await prisma.teacher.findMany({
      where: { id: { in: Array.from(teacherIds) } },
      include: {
        user: {
          select: { id: true, username: true, profile: { select: { firstName: true, lastName: true, avatar: true } } },
        },
      },
    });

    return teachers.map(t => {
      const teacherLessons = lessons.filter(l => l.teacherId === t.id);
      const isHomeroom = classes.some(c => c.homeroomTeacherId === t.id);
      return {
        teacherId: t.id,
        userId: t.user.id,
        name: t.user.profile ? `${t.user.profile.firstName} ${t.user.profile.lastName}` : t.user.username,
        subjects: [...new Set(teacherLessons.map(l => l.subject.name))],
        isHomeroom,
      };
    });
  }

  /**
   * Start or get existing PARENT_TEACHER conversation with a teacher.
   * parentId = the parent's User ID, teacherUserId = the teacher's User ID.
   */
  static async startParentTeacherChat(parentUserId: string, teacherUserId: string, studentId?: string) {
    // Verify the parent has a child linked
    if (studentId) {
      const link = await prisma.parentStudent.findUnique({
        where: { parentId_studentId: { parentId: parentUserId, studentId } },
      });
      if (!link) {
        throw new ApiError(403, 'NOT_LINKED', 'You are not linked to this student');
      }
    }

    // Verify the target is a teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      include: { user: { select: { username: true, profile: true } } },
    });
    if (!teacher) throw new ApiError(404, 'TEACHER_NOT_FOUND', 'Teacher not found');

    // Check if conversation already exists (DIRECT or PARENT_TEACHER with exactly these 2 participants)
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'PARENT_TEACHER',
        AND: [
          { participants: { some: { userId: parentUserId } } },
          { participants: { some: { userId: teacherUserId } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, username: true, role: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existing) {
      return { conversation: existing, created: false };
    }

    // Create new PARENT_TEACHER conversation
    const parentUser = await prisma.user.findUnique({
      where: { id: parentUserId },
      select: { username: true, profile: { select: { firstName: true, lastName: true } } },
    });

    const parentName = parentUser?.profile
      ? `${parentUser.profile.firstName} ${parentUser.profile.lastName}`
      : parentUser?.username || 'Parent';
    const teacherName = teacher.user.profile
      ? `${teacher.user.profile.firstName} ${teacher.user.profile.lastName}`
      : teacher.user.username;

    const conversation = await prisma.conversation.create({
      data: {
        type: 'PARENT_TEACHER',
        name: `${parentName} ↔ ${teacherName}`,
        createdBy: parentUserId,
        participants: {
          create: [
            { userId: parentUserId, role: 'MEMBER' },
            { userId: teacherUserId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, username: true, role: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    return { conversation, created: true };
  }

  /**
   * Get all PARENT_TEACHER conversations for a user (as parent or teacher).
   */
  static async getParentTeacherConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        type: 'PARENT_TEACHER',
        participants: { some: { userId } },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, username: true, role: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Compute unread counts
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const lastReadAt = participant?.lastReadAt;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            deletedAt: null,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        const otherParticipant = conv.participants.find((p) => p.userId !== userId);
        const otherUser = otherParticipant?.user;
        const otherName = otherUser?.profile
          ? `${otherUser.profile.firstName} ${otherUser.profile.lastName}`
          : otherUser?.username || 'Unknown';

        return {
          ...conv,
          lastMessage: conv.messages[0] || null,
          unreadCount,
          otherParticipant: {
            id: otherUser?.id || '',
            name: otherName,
            role: otherUser?.role,
            avatar: otherUser?.profile?.avatar,
          },
        };
      }),
    );

    return result;
  }

  /**
   * Unlink a child from a parent.
   */
  static async unlinkChild(parentUserId: string, studentId: string) {
    const link = await prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parentUserId, studentId } },
    });
    if (!link) throw new ApiError(404, 'LINK_NOT_FOUND', 'Link not found');

    await prisma.parentStudent.delete({
      where: { id: link.id },
    });

    return { deleted: true };
  }
}
