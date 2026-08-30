import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { ApiError } from '../utils/apiResponse';

// Check if user has a specific permission (e.g. "users.create")
export function requirePermission(resource: string, action: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
      }

      const { userId, role } = req.user;

      // SUPER_ADMIN always has all permissions
      if (role === 'SUPER_ADMIN') return next();

      // Check role-based default permissions
      const roleHasPermission = checkRolePermission(role, resource, action);
      if (!roleHasPermission) {
        return next(new ApiError(403, 'FORBIDDEN', `Insufficient permissions: ${resource}.${action}`));
      }

      // Check for explicit permission overrides on the user
      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId,
          permission: { resource, action },
        },
        include: { permission: true },
      });

      // If there's an explicit denial, block it
      if (userPermission && !userPermission.granted) {
        return next(new ApiError(403, 'PERMISSION_DENIED', `Permission denied: ${resource}.${action}`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Role → default permission matrix
function checkRolePermission(role: string, resource: string, action: string): boolean {
  const permissions: Record<string, Record<string, string[]>> = {
    SCHOOL_ADMIN: {
      users: ['create', 'read', 'update', 'delete'],
      schools: ['read', 'update'],
      classes: ['create', 'read', 'update', 'delete'],
      subjects: ['create', 'read', 'update', 'delete'],
      teachers: ['create', 'read', 'update'],
      students: ['create', 'read', 'update'],
      lessons: ['read', 'update', 'delete'],
      schedules: ['create', 'read', 'update', 'delete'],
      homework: ['read', 'update', 'delete'],
      announcements: ['create', 'read', 'update', 'delete'],
      notifications: ['read'],
      reports: ['create', 'read', 'update'],
      complaints: ['read', 'update'],
      blocked_users: ['create', 'read', 'delete'],
      permissions: ['read', 'update'],
      messages: ['read'],
    },
    TEACHER: {
      users: ['read'],
      classes: ['read'],
      subjects: ['read'],
      teachers: ['read'],
      students: ['read'],
      lessons: ['create', 'read', 'update', 'delete'],
      schedules: ['read'],
      homework: ['create', 'read', 'update', 'delete'],
      announcements: ['create', 'read', 'update', 'delete'],
      notifications: ['read'],
      reports: ['create', 'read'],
      messages: ['create', 'read', 'update'],
    },
    STUDENT: {
      users: ['read'],
      classes: ['read'],
      subjects: ['read'],
      teachers: ['read'],
      students: ['read'],
      lessons: ['read'],
      schedules: ['read'],
      homework: ['read'],
      announcements: ['read'],
      notifications: ['read'],
      reports: ['read'],
      messages: ['create', 'read', 'update'],
    },
    PARENT: {
      users: ['read'],
      classes: ['read'],
      subjects: ['read'],
      lessons: ['read'],
      schedules: ['read'],
      homework: ['read'],
      announcements: ['read'],
      notifications: ['read'],
      reports: ['read'],
      messages: ['create', 'read', 'update'],
    },
  };

  const rolePerms = permissions[role];
  if (!rolePerms) return false;

  const actions = rolePerms[resource];
  if (!actions) return false;

  return actions.includes(action);
}
