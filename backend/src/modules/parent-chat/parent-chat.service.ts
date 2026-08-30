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

  // ═══════════════════════════════════════════════════════════════
  // PARENT GROUP CHAT — parents of the same class communicating together
  // ═══════════════════════════════════════════════════════════════

  /**
   * Get or create a PARENT_GROUP conversation for a specific class.
   * All parents who have a child in that class are auto-added as participants.
   */
  static async getOrCreateClassParentGroup(parentUserId: string, classId: string) {
    // Verify this parent has a child in this class
    const childInClass = await prisma.parentStudent.findFirst({
      where: {
        parentId: parentUserId,
        student: { classId },
      },
    });
    if (!childInClass) {
      throw new ApiError(403, 'NOT_IN_CLASS', 'You do not have a child in this class');
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true, school: { select: { name: true } } },
    });
    if (!classInfo) throw new ApiError(404, 'CLASS_NOT_FOUND', 'Class not found');

    // Find existing PARENT_GROUP for this class — stored in conversation name as "Parents of Class X"
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'PARENT_GROUP',
        name: `Parents of Class ${classInfo.name}`,
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
      // Ensure this parent is a participant (in case they linked child after group was created)
      const isParticipant = existing.participants.some((p) => p.userId === parentUserId);
      if (!isParticipant) {
        await prisma.conversationParticipant.create({
          data: { conversationId: existing.id, userId: parentUserId, role: 'MEMBER' },
        });
        // Re-fetch
        const refetched = await prisma.conversation.findUnique({
          where: { id: existing.id },
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
        return { conversation: refetched, created: false };
      }
      return { conversation: existing, created: false };
    }

    // Create new group — find ALL parents who have children in this class
    const studentsInClass = await prisma.parentStudent.findMany({
      where: { student: { classId } },
      select: { parentId: true },
      distinct: ['parentId'],
    });

    const parentIds = studentsInClass.map(s => s.parentId);
    // Always include the requesting parent
    if (!parentIds.includes(parentUserId)) parentIds.push(parentUserId);

    const conversation = await prisma.conversation.create({
      data: {
        type: 'PARENT_GROUP',
        name: `Parents of Class ${classInfo.name}`,
        createdBy: parentUserId,
        participants: {
          create: parentIds.map(pid => ({
            userId: pid,
            role: pid === parentUserId ? 'ADMIN' : 'MEMBER',
          })),
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
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return { conversation, created: true };
  }

  /**
   * Get all PARENT_GROUP conversations for a parent.
   * Also returns class info so the parent knows which class group it is.
   */
  static async getParentGroupConversations(parentUserId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        type: 'PARENT_GROUP',
        participants: { some: { userId: parentUserId } },
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

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === parentUserId);
        const lastReadAt = participant?.lastReadAt;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: parentUserId },
            deletedAt: null,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return {
          ...conv,
          lastMessage: conv.messages[0] || null,
          unreadCount,
          participantCount: conv.participants.length,
        };
      }),
    );

    return result;
  }

  /**
   * Get available class parent groups for a parent (classes where their children are).
   * Returns class info + whether a group already exists.
   */
  static async getAvailableClassGroups(parentUserId: string) {
    const children = await prisma.parentStudent.findMany({
      where: { parentId: parentUserId },
      select: {
        student: {
          select: {
            id: true,
            classId: true,
            class: { select: { id: true, name: true, school: { select: { name: true } } } },
            user: { select: { profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    const classMap = new Map<string, { classId: string; className: string; schoolName: string; childName: string }>();

    children.forEach(c => {
      if (c.student.classId && c.student.class) {
        if (!classMap.has(c.student.classId)) {
          classMap.set(c.student.classId, {
            classId: c.student.class.id,
            className: c.student.class.name,
            schoolName: c.student.class.school?.name || '',
            childName: c.student.user.profile
              ? `${c.student.user.profile.firstName} ${c.student.user.profile.lastName}`
              : 'Child',
          });
        }
      }
    });

    const classes = Array.from(classMap.values());

    // Check which already have groups
    const groupChecks = await Promise.all(
      classes.map(async (c) => {
        const group = await prisma.conversation.findFirst({
          where: { type: 'PARENT_GROUP', name: `Parents of Class ${c.className}` },
          select: { id: true, participants: { select: { userId: true } } },
        });
        return {
          ...c,
          groupExists: !!group,
          isMember: group?.participants.some((p) => p.userId === parentUserId) || false,
          conversationId: group?.id || null,
        };
      })
    );

    return groupChecks;
  }
}
