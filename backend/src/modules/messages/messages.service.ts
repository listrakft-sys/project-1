import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { PaginationParams } from '../../utils/pagination';
import { canUserMessageTarget } from '../conversations/conversations.service';

export class MessageService {
  static async findByConversation(
    conversationId: string,
    userId: string,
    pagination: PaginationParams,
  ) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    const where = {
      conversationId,
      deletedAt: null,
    };

    const [total, messages] = await Promise.all([
      prisma.message.count({ where }),
      prisma.message.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'asc' }, // Oldest first
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
      }),
    ]);

    return {
      messages,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  static async send(
    conversationId: string,
    senderId: string,
    data: { content: string; attachments?: string[] },
  ) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found');
    }

    const senderParticipant = conversation.participants.find((p) => p.userId === senderId);
    if (!senderParticipant) {
      throw new ApiError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    // Check privacy & block status for all other participants
    const otherParticipants = conversation.participants.filter((p) => p.userId !== senderId);
    for (const p of otherParticipants) {
      const check = await canUserMessageTarget(senderId, p.userId);
      if (!check.allowed) {
        throw new ApiError(
          403,
          'PRIVACY_RESTRICTION',
          check.reason || 'Cannot send message due to privacy/block settings',
        );
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: data.content,
        attachments: data.attachments || [],
        readBy: [senderId],
      },
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
    });

    // Update conversation updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create Notification for each other participant with type MESSAGE
    if (otherParticipants.length > 0) {
      const senderName = message.sender.profile
        ? `${message.sender.profile.firstName} ${message.sender.profile.lastName}`.trim()
        : message.sender.username;

      const previewContent =
        data.content.length > 100 ? `${data.content.substring(0, 97)}...` : data.content;

      await prisma.notification.createMany({
        data: otherParticipants.map((p) => ({
          userId: p.userId,
          type: 'MESSAGE',
          title: `New message from ${senderName}`,
          content: previewContent,
          data: { conversationId, messageId: message.id, senderId },
          link: `/conversations/${conversationId}`,
        })),
      });
    }

    return message;
  }

  static async edit(messageId: string, userId: string, data: { content: string }) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
    }

    if (message.senderId !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only edit your own messages');
    }

    if (message.deletedAt) {
      throw new ApiError(400, 'MESSAGE_DELETED', 'Cannot edit a deleted message');
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: data.content,
        editedAt: new Date(),
      },
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
    });

    return updatedMessage;
  }

  static async delete(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new ApiError(404, 'MESSAGE_NOT_FOUND', 'Message not found');
    }

    if (message.senderId !== userId) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only delete your own messages');
    }

    if (message.deletedAt) {
      return { id: messageId, deleted: true };
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { id: messageId, deleted: true };
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

    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: {
        lastReadAt: new Date(),
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

    return { message: 'Messages marked as read' };
  }
}
