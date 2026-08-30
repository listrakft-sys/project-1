import prisma from '../../config/prisma';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, JwtPayload } from '../../utils/jwt';
import { ApiError } from '../../utils/apiResponse';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

export class AuthService {
  static async register(data: {
    email: string;
    username: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
    preferredLang: string;
  }) {
    // Check if email or username already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
      },
    });

    if (existing) {
      if (existing.email === data.email) {
        throw new ApiError(409, 'EMAIL_TAKEN', 'Email is already registered');
      }
      throw new ApiError(409, 'USERNAME_TAKEN', 'Username is already taken');
    }

    const hashedPassword = await hashPassword(data.password);

    // Create user + profile + privacy settings in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
          password: hashedPassword,
          role: data.role as any,
          status: 'ACTIVE', // In production, could be PENDING with email verification
          preferredLang: data.preferredLang,
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
        include: { profile: true },
      });

      // If role is STUDENT, create student record (school assigned later by admin)
      if (data.role === 'STUDENT') {
        await tx.student.create({
          data: { userId: newUser.id, schoolId: '' }, // schoolId set by admin
        }).catch(() => {
          // schoolId required — student record created when admin assigns
        });
      }

      return newUser;
    });

    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
      accessToken,
      refreshToken,
    };
  }

  static async login(data: { emailOrUsername: string; password: string }) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.emailOrUsername.toLowerCase() },
          { username: data.emailOrUsername },
        ],
      },
      include: { profile: true },
    });

    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email/username or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
    }

    if (user.status === 'INACTIVE') {
      throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Your account is inactive. Contact an administrator.');
    }

    const validPassword = await comparePassword(data.password, user.password);
    if (!validPassword) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email/username or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(token: string) {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');
    }

    // Rotate: revoke old, issue new
    const newPayload: JwtPayload = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };

    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = await this.createRefreshToken(payload.userId);

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date(), replacedBy: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  static async logout(token: string) {
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
      });
    }
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        privacySettings: true,
        teacher: { include: { school: true, subjects: true } },
        student: { include: { school: true, class: true } },
      },
    });

    if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

    // Strip password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');

    const valid = await comparePassword(data.currentPassword, user.password);
    if (!valid) {
      throw new ApiError(400, 'WRONG_PASSWORD', 'Current password is incorrect');
    }

    const hashed = await hashPassword(data.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    // Revoke all refresh tokens (force re-login)
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    logger.info(`Password changed for user ${userId}`);
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Don't reveal if email exists

    // In production: generate token, send email
    // For now, just log it
    const resetToken = crypto.randomBytes(32).toString('hex');
    logger.info(`Password reset requested for ${email}, token: ${resetToken}`);
  }

  static async resetPassword(data: { token: string; newPassword: string }) {
    // In production: verify token from storage
    // For MVP: this would be implemented with a password reset token table
    throw new ApiError(501, 'NOT_IMPLEMENTED', 'Password reset via token not yet implemented');
  }

  private static async createRefreshToken(userId: string): Promise<string> {
    const payload: JwtPayload = { userId, role: '', email: '' };

    // Get the actual user to fill role/email
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
    if (user) {
      payload.role = user.role;
      payload.email = user.email;
    }

    const token = signRefreshToken(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });

    return token;
  }
}
