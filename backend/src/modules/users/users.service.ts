import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';

export class UserService {
  /**
   * Check if a block relationship exists between requesting user and target user.
   */
  private static async checkBlockStatus(requestingUserId: string, targetUserId: string) {
    if (!requestingUserId || requestingUserId === targetUserId) return;

    const block = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId: requestingUserId, blockedById: targetUserId },
          { userId: targetUserId, blockedById: requestingUserId },
        ],
      },
    });

    if (block) {
      if (block.blockedById === targetUserId) {
        throw new ApiError(403, 'USER_BLOCKED', 'You are blocked by this user');
      } else {
        throw new ApiError(403, 'USER_BLOCKED', 'You have blocked this user');
      }
    }
  }

  /**
   * Sanitize user object according to privacy settings and requesting user permissions.
   */
  public static sanitizeUser(user: any, requestingUserId: string, userRole?: string) {
    if (!user) return null;

    const isSelf = user.id === requestingUserId;
    const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN';

    // Password must never be leaked
    const { password, ...safeUser } = user;

    if (isSelf || isAdmin) {
      return safeUser;
    }

    const privacy = safeUser.privacySettings;
    const visibility = privacy?.profileVisibility || 'SCHOOL_ONLY';

    if (visibility === 'PRIVATE') {
      throw new ApiError(403, 'PROFILE_PRIVATE', 'This profile is private');
    }
    if (visibility === 'TEACHERS_ONLY' && userRole !== 'TEACHER') {
      throw new ApiError(403, 'PROFILE_PRIVATE', 'This profile is visible to teachers only');
    }
    if (visibility === 'STUDENTS_ONLY' && userRole !== 'STUDENT') {
      throw new ApiError(403, 'PROFILE_PRIVATE', 'This profile is visible to students only');
    }

    const showEmail = privacy?.showEmail ?? false;
    const showPhone = privacy?.showPhone ?? false;
    const showAddress = privacy?.showAddress ?? false;

    if (!showEmail) {
      delete safeUser.email;
    }

    if (safeUser.profile) {
      const profileCopy = { ...safeUser.profile };
      if (!showPhone) {
        delete profileCopy.phone;
        delete profileCopy.emergencyPhone;
        delete profileCopy.emergencyContact;
      }
      if (!showAddress) {
        delete profileCopy.address;
        delete profileCopy.city;
        delete profileCopy.country;
      }
      safeUser.profile = profileCopy;
    }

    return safeUser;
  }

  /**
   * List/search users with pagination, respecting privacy settings and block relationships.
   */
  static async findAll(requestingUserId: string, query: any, userRole?: string) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const search = query.search?.trim();

    // Get all user IDs involved in a block relationship with requestingUserId
    const blocks = await prisma.blockedUser.findMany({
      where: {
        OR: [
          { userId: requestingUserId },
          { blockedById: requestingUserId },
        ],
      },
      select: { userId: true, blockedById: true },
    });

    const blockedUserIds = new Set<string>();
    for (const b of blocks) {
      if (b.userId === requestingUserId) blockedUserIds.add(b.blockedById);
      if (b.blockedById === requestingUserId) blockedUserIds.add(b.userId);
    }

    const where: any = {};

    if (blockedUserIds.size > 0) {
      where.id = { notIn: Array.from(blockedUserIds) };
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (search) {
      where.OR = [
        {
          username: { contains: search, mode: 'insensitive' },
          OR: [
            { privacySettings: { searchableByUsername: true } },
            { privacySettings: null },
          ],
        },
        {
          profile: {
            firstName: { contains: search, mode: 'insensitive' },
          },
          OR: [
            { privacySettings: { searchableByName: true } },
            { privacySettings: null },
          ],
        },
        {
          profile: {
            lastName: { contains: search, mode: 'insensitive' },
          },
          OR: [
            { privacySettings: { searchableByName: true } },
            { privacySettings: null },
          ],
        },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: true,
          privacySettings: true,
          teacher: { include: { school: true } },
          student: { include: { school: true, class: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const sanitizedUsers = users
      .map((u) => {
        try {
          return this.sanitizeUser(u, requestingUserId, userRole);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return {
      users: sanitizedUsers,
      total,
      page,
      limit,
    };
  }

  /**
   * Find a single user by ID, checking block status and applying privacy filters.
   */
  static async findById(id: string, requestingUserId: string, userRole?: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        privacySettings: true,
        teacher: { include: { school: true, subjects: true } },
        student: { include: { school: true, class: true } },
      },
    });

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    await this.checkBlockStatus(requestingUserId, id);

    return this.sanitizeUser(user, requestingUserId, userRole);
  }

  /**
   * Find a single user by @username, checking block status and applying privacy filters.
   */
  static async findByUsername(usernameInput: string, requestingUserId: string, userRole?: string) {
    const username = usernameInput.replace(/^@/, '');

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        privacySettings: true,
        teacher: { include: { school: true, subjects: true } },
        student: { include: { school: true, class: true } },
      },
    });

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    await this.checkBlockStatus(requestingUserId, user.id);

    return this.sanitizeUser(user, requestingUserId, userRole);
  }

  /**
   * Update user record (self or admin).
   */
  static async updateUser(id: string, requestingUserId: string, requestingUserRole: string, data: any) {
    const isSelf = id === requestingUserId;
    const isAdmin = requestingUserRole === 'SUPER_ADMIN' || requestingUserRole === 'SCHOOL_ADMIN';

    if (!isSelf && !isAdmin) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only update your own user account');
    }

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updateData: any = {};

    if (data.email && data.email !== existingUser.email) {
      const emailConflict = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailConflict) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered');
      }
      updateData.email = data.email;
    }

    if (data.username && data.username !== existingUser.username) {
      const usernameConflict = await prisma.user.findUnique({ where: { username: data.username } });
      if (usernameConflict) {
        throw new ApiError(409, 'USERNAME_TAKEN', 'Username is already taken');
      }
      updateData.username = data.username;
    }

    if (data.preferredLang !== undefined) {
      updateData.preferredLang = data.preferredLang;
    }

    if (isAdmin) {
      if (data.role !== undefined) updateData.role = data.role;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isEmailVerified !== undefined) updateData.isEmailVerified = data.isEmailVerified;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: true,
        privacySettings: true,
      },
    });

    const { password, ...safeUser } = updatedUser;
    return safeUser;
  }

  /**
   * Update profile (self only).
   */
  static async updateProfile(userId: string, requestingUserId: string, data: any) {
    if (userId !== requestingUserId) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only update your own profile');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        middleName: data.middleName,
        avatar: data.avatar,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        city: data.city,
        country: data.country,
        bio: data.bio,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
      },
      update: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.middleName !== undefined && { middleName: data.middleName }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
        ...(data.emergencyPhone !== undefined && { emergencyPhone: data.emergencyPhone }),
      },
    });

    return updatedProfile;
  }

  /**
   * Update privacy settings (self only).
   */
  static async updatePrivacySettings(userId: string, requestingUserId: string, data: any) {
    if (userId !== requestingUserId) {
      throw new ApiError(403, 'FORBIDDEN', 'You can only update your own privacy settings');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updatedPrivacy = await prisma.privacySettings.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    return updatedPrivacy;
  }

  /**
   * Delete user (admin only).
   */
  static async deleteUser(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    await prisma.user.delete({ where: { id } });
    return { id, deleted: true };
  }

  /**
   * Block a user.
   */
  static async blockUser(blockedById: string, targetUserId: string, reason?: string) {
    if (blockedById === targetUserId) {
      throw new ApiError(400, 'CANNOT_BLOCK_SELF', 'You cannot block yourself');
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedById: {
          userId: targetUserId,
          blockedById,
        },
      },
    });

    if (existingBlock) {
      throw new ApiError(400, 'ALREADY_BLOCKED', 'User is already blocked');
    }

    const block = await prisma.blockedUser.create({
      data: {
        userId: targetUserId,
        blockedById,
        reason,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
    });

    return block;
  }

  /**
   * Unblock a user.
   */
  static async unblockUser(blockedById: string, targetUserId: string) {
    const existingBlock = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedById: {
          userId: targetUserId,
          blockedById,
        },
      },
    });

    if (!existingBlock) {
      throw new ApiError(404, 'NOT_BLOCKED', 'User is not blocked');
    }

    await prisma.blockedUser.delete({
      where: {
        userId_blockedById: {
          userId: targetUserId,
          blockedById,
        },
      },
    });

    return { userId: targetUserId, unblocked: true };
  }

  /**
   * Get list of users blocked by requesting user.
   */
  static async getBlockedUsers(userId: string, query?: any) {
    const page = Math.max(1, parseInt(query?.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query?.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [blockedList, total] = await Promise.all([
      prisma.blockedUser.findMany({
        where: { blockedById: userId },
        skip,
        take: limit,
        orderBy: { blockedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              status: true,
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
      prisma.blockedUser.count({
        where: { blockedById: userId },
      }),
    ]);

    return {
      blockedUsers: blockedList,
      total,
      page,
      limit,
    };
  }
}
