import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { PaginationParams } from '../../utils/pagination';
import { ConversationType, ParticipantRole } from '@prisma/client';

/**
 * Check whether senderId is allowed to message targetUserId based on
 * blocked user records and privacy settings (whoCanMessage).
 */
export async function canUserMessageTarget(
  senderId: string,
  targetUserId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  if (senderId === targetUserId) {
    return { allowed: true };
  }

  // Bypass for SUPER_ADMIN
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { role: true },
  });
  if (sender?.role === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  // 1. Check blocked status in both directions
  const isBlocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { userId: senderId, blockedById: targetUserId },
        { userId: targetUserId, blockedById: senderId },
      ],
    },
  });

  if (isBlocked) {
    return { allowed: false, reason: 'Communication is blocked between these users' };
  }

  // 2. Check target user's PrivacySettings
  const targetPrivacy = await prisma.privacySettings.findUnique({
    where: { userId: targetUserId },
  });

  const whoCanMessage = targetPrivacy?.whoCanMessage || 'SCHOOL_ONLY';

  if (whoCanMessage === 'EVERYONE') {
    return { allowed: true };
  }

  if (whoCanMessage === 'NO_ONE') {
    return { allowed: false, reason: 'Target user does not accept messages' };
  }

  if (whoCanMessage === 'SCHOOL_ONLY') {
    const [
      senderTeacher,
      senderStudent,
      senderAdminSchools,
      targetTeacher,
      targetStudent,
      targetAdminSchools,
    ] = await Promise.all([
      prisma.teacher.findUnique({ where: { userId: senderId }, select: { schoolId: true } }),
      prisma.student.findUnique({ where: { userId: senderId }, select: { schoolId: true } }),
      prisma.school.findMany({ where: { adminId: senderId }, select: { id: true } }),
      prisma.teacher.findUnique({ where: { userId: targetUserId }, select: { schoolId: true } }),
      prisma.student.findUnique({ where: { userId: targetUserId }, select: { schoolId: true } }),
      prisma.school.findMany({ where: { adminId: targetUserId }, select: { id: true } }),
    ]);

    const senderSchoolIds = new Set<string>();
    if (senderTeacher?.schoolId) senderSchoolIds.add(senderTeacher.schoolId);
    if (senderStudent?.schoolId) senderSchoolIds.add(senderStudent.schoolId);
    senderAdminSchools.forEach((s) => senderSchoolIds.add(s.id));

    const targetSchoolIds = new Set<string>();
    if (targetTeacher?.schoolId) targetSchoolIds.add(targetTeacher.schoolId);
    if (targetStudent?.schoolId) targetStudent.schoolId && targetSchoolIds.add(targetStudent.schoolId);
    targetAdminSchools.forEach((s) => targetSchoolIds.add(s.id));

    if (senderSchoolIds.size === 0 && targetSchoolIds.size === 0) {
      return { allowed: true };
    }

    const sharesSchool = Array.from(senderSchoolIds).some((id) => targetSchoolIds.has(id));
    if (!sharesSchool) {
      return { allowed: false, reason: 'User only accepts messages from members of the same school' };
    }
    return { allowed: true };
  }

  if (whoCanMessage === 'CLASS_ONLY') {
    const [senderStudent, senderTeacher, targetStudent, targetTeacher] = await Promise.all([
      prisma.student.findUnique({ where: { userId: senderId }, select: { classId: true } }),
      prisma.teacher.findUnique({ where: { userId: senderId }, select: { id: true } }),
      prisma.student.findUnique({ where: { userId: targetUserId }, select: { classId: true } }),
      prisma.teacher.findUnique({ where: { userId: targetUserId }, select: { id: true } }),
    ]);

    const getClassesForTeacher = async (teacherId: string) => {
      const homeroom = await prisma.class.findMany({
        where: { homeroomTeacherId: teacherId },
        select: { id: true },
      });
      const lessons = await prisma.lesson.findMany({
        where: { teacherId },
        select: { classId: true },
      });
      return [...homeroom.map((h) => h.id), ...lessons.map((l) => l.classId)];
    };

    const senderClassIds = new Set<string>();
    if (senderStudent?.classId) senderClassIds.add(senderStudent.classId);
    if (senderTeacher) {
      const teacherClasses = await getClassesForTeacher(senderTeacher.id);
      teacherClasses.forEach((c) => senderClassIds.add(c));
    }

    const targetClassIds = new Set<string>();
    if (targetStudent?.classId) targetClassIds.add(targetStudent.classId);
    if (targetTeacher) {
      const teacherClasses = await getClassesForTeacher(targetTeacher.id);
      teacherClasses.forEach((c) => targetClassIds.add(c));
    }

    if (senderClassIds.size === 0 && targetClassIds.size === 0) {
      return { allowed: true };
    }

    const sharesClass = Array.from(senderClassIds).some((id) => targetClassIds.has(id));
    if (!sharesClass) {
      return { allowed: false, reason: 'User only accepts messages from classmates or teachers in the same class' };
    }
    return { allowed: true };
  }

  return { allowed: true };
}

export class ConversationService {
  static async findAll(userId: string, pagination: PaginationParams) {
    const where = {
      participants: {
        some: { userId },
      },
    };

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  role: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const userParticipant = conv.participants.find((p) => p.userId === userId);
        const lastReadAt = userParticipant?.lastReadAt;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            deletedAt: null,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        const { messages, ...convData } = conv;
        return {
          ...convData,
          lastMessage: messages[0] || null,
          unreadCount,
        };
      }),
    );

    return {
      conversations: formattedConversations,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  static async findById(conversationId: string, userId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          take: 50,
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                email: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    const userParticipant = conversation.participants.find((p) => p.userId === userId);
    const lastReadAt = userParticipant?.lastReadAt;

    const unreadCount = await prisma.message.count({
      where: {
        conversationId,
        senderId: { not: userId },
        deletedAt: null,
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });

    return {
      ...conversation,
      unreadCount,
    };
  }

  static async create(
    userId: string,
    data: {
      type: ConversationType;
      name?: string;
      avatar?: string;
      participantIds: string[];
    },
  ) {
    const allParticipantIds = Array.from(new Set([userId, ...data.participantIds]));

    // Check users exist
    const users = await prisma.user.findMany({
      where: { id: { in: allParticipantIds } },
      select: { id: true },
    });
    if (users.length !== allParticipantIds.length) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'One or more specified participants were not found');
    }

    if (data.type === 'DIRECT') {
      if (allParticipantIds.length !== 2) {
        throw new ApiError(
          400,
          'INVALID_PARTICIPANTS',
          'Direct conversations must have exactly 2 participants',
        );
      }

      // Check if DIRECT conversation already exists between these 2 users
      const existingDirect = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: allParticipantIds[0] } } },
            { participants: { some: { userId: allParticipantIds[1] } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  role: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  profile: { select: { firstName: true, lastName: true, avatar: true } },
                },
              },
            },
          },
        },
      });

      if (existingDirect) {
        return existingDirect;
      }
    }

    // Check privacy & block restrictions for other participants
    const otherParticipantIds = allParticipantIds.filter((id) => id !== userId);
    for (const targetId of otherParticipantIds) {
      const check = await canUserMessageTarget(userId, targetId);
      if (!check.allowed) {
        throw new ApiError(
          403,
          'PRIVACY_RESTRICTION',
          check.reason || 'Cannot create conversation with this user',
        );
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        type: data.type,
        name: data.name,
        avatar: data.avatar,
        createdBy: userId,
        participants: {
          create: allParticipantIds.map((pId) => ({
            userId: pId,
            role: pId === userId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return conversation;
  }

  static async update(
    conversationId: string,
    userId: string,
    data: { name?: string; avatar?: string },
  ) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    if (participant.role !== 'ADMIN') {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only conversation admins can update conversation details',
      );
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                role: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return updated;
  }

  static async leave(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ApiError(404, 'NOT_FOUND', 'You are not a participant in this conversation');
    }

    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    return { message: 'Successfully left conversation' };
  }

  static async addParticipant(
    conversationId: string,
    adminUserId: string,
    targetUserId: string,
    role?: ParticipantRole,
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    if (conversation.type === 'DIRECT') {
      throw new ApiError(400, 'INVALID_ACTION', 'Cannot add participants to a direct conversation');
    }

    const adminParticipant = conversation.participants.find((p) => p.userId === adminUserId);
    if (!adminParticipant) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    if (adminParticipant.role !== 'ADMIN') {
      throw new ApiError(403, 'FORBIDDEN', 'Only conversation admins can add participants');
    }

    const existingTarget = conversation.participants.find((p) => p.userId === targetUserId);
    if (existingTarget) {
      throw new ApiError(409, 'ALREADY_PARTICIPANT', 'User is already a participant in this conversation');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User to add not found');
    }

    // Check privacy & block settings
    const check = await canUserMessageTarget(adminUserId, targetUserId);
    if (!check.allowed) {
      throw new ApiError(
        403,
        'PRIVACY_RESTRICTION',
        check.reason || 'Cannot add this user due to privacy settings',
      );
    }

    const newParticipant = await prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId: targetUserId,
        role: role || 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return newParticipant;
  }

  static async removeParticipant(
    conversationId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (!conversation) {
      throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const currentParticipant = conversation.participants.find((p) => p.userId === currentUserId);
    if (!currentParticipant) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    const targetParticipant = conversation.participants.find((p) => p.userId === targetUserId);
    if (!targetParticipant) {
      throw new ApiError(
        404,
        'PARTICIPANT_NOT_FOUND',
        'Target user is not a participant in this conversation',
      );
    }

    const isSelf = currentUserId === targetUserId;
    const isAdmin = currentParticipant.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Only conversation admins can remove other participants',
      );
    }

    await prisma.conversationParticipant.delete({
      where: {
        conversationId_userId: { conversationId, userId: targetUserId },
      },
    });

    return { message: 'Participant removed successfully' };
  }

  static async getUnreadCount(userId: string) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    if (participations.length === 0) {
      return { unreadCount: 0 };
    }

    let totalUnread = 0;
    for (const p of participations) {
      const unread = await prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          deletedAt: null,
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      });
      totalUnread += unread;
    }

    return { unreadCount: totalUnread };
  }

  static async markAsRead(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    const now = new Date();

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        lastReadAt: now,
      },
    });

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        NOT: { readBy: { has: userId } },
      },
      data: {
        readBy: { push: userId },
      },
    });

    return { message: 'Conversation marked as read' };
  }
}
