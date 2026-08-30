import { NotificationType, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';
import { JwtPayload } from '../../utils/jwt';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  content: string;
  data?: any;
  link?: string;
}

export class NotificationService {
  /**
   * Find notifications for current user with optional filters and pagination.
   */
  static async findAll(query: any, currentUser: JwtPayload) {
    const { page, limit, skip } = getPagination({ query } as any);
    const { type, isRead } = query;

    const where: Prisma.NotificationWhereInput = {
      userId: currentUser.userId,
    };

    if (type && Object.values(NotificationType).includes(type as NotificationType)) {
      where.type = type as NotificationType;
    }

    if (isRead !== undefined) {
      if (typeof isRead === 'boolean') {
        where.isRead = isRead;
      } else if (typeof isRead === 'string') {
        where.isRead = isRead === 'true';
      }
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { data: notifications, total, page, limit };
  }

  /**
   * Get unread notification count for current user.
   */
  static async getUnreadCount(currentUser: JwtPayload) {
    const count = await prisma.notification.count({
      where: {
        userId: currentUser.userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Mark a single notification as read. Must belong to current user.
   */
  static async markAsRead(id: string, currentUser: JwtPayload) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
    }

    if (notification.userId !== currentUser.userId) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Access denied to this notification'
      );
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return updated;
  }

  /**
   * Mark all notifications for current user as read.
   */
  static async markAllAsRead(currentUser: JwtPayload) {
    const result = await prisma.notification.updateMany({
      where: {
        userId: currentUser.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return { count: result.count, success: true };
  }

  /**
   * Delete own notification. Must belong to current user.
   */
  static async delete(id: string, currentUser: JwtPayload) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
    }

    if (notification.userId !== currentUser.userId) {
      throw new ApiError(
        403,
        'FORBIDDEN',
        'Access denied to this notification'
      );
    }

    await prisma.notification.delete({
      where: { id },
    });

    return { success: true, message: 'Notification deleted successfully' };
  }

  /**
   * Internal helper method to create a notification record.
   */
  static async create(data: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as NotificationType,
        title: data.title,
        content: data.content,
        data: data.data ?? null,
        link: data.link ?? null,
      },
    });

    return notification;
  }
}
