import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { CreatePermissionInput, UpdateUserPermissionInput } from './permissions.schema';

export class PermissionService {
  /**
   * List all permissions.
   */
  static async findAll() {
    const permissions = await prisma.permission.findMany({
      orderBy: { resource: 'asc' },
    });
    return permissions;
  }

  /**
   * Create a new permission (super admin only).
   */
  static async create(data: CreatePermissionInput) {
    const existing = await prisma.permission.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new ApiError(409, 'PERMISSION_EXISTS', 'Permission with this name already exists');
    }

    const permission = await prisma.permission.create({
      data: {
        name: data.name,
        resource: data.resource,
        action: data.action,
        description: data.description ?? null,
      },
    });
    return permission;
  }

  /**
   * Get all permissions for a specific user.
   */
  static async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
    });

    return userPermissions;
  }

  /**
   * Grant or revoke a permission for a user.
   */
  static async updateUserPermission(userId: string, data: UpdateUserPermissionInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const permission = await prisma.permission.findUnique({
      where: { id: data.permissionId },
    });
    if (!permission) {
      throw new ApiError(404, 'PERMISSION_NOT_FOUND', 'Permission not found');
    }

    const existing = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId,
          permissionId: data.permissionId,
        },
      },
    });

    if (existing) {
      const updated = await prisma.userPermission.update({
        where: {
          userId_permissionId: {
            userId,
            permissionId: data.permissionId,
          },
        },
        data: { granted: data.granted },
        include: { permission: true },
      });
      return updated;
    }

    const created = await prisma.userPermission.create({
      data: {
        userId,
        permissionId: data.permissionId,
        granted: data.granted,
      },
      include: { permission: true },
    });
    return created;
  }
}
