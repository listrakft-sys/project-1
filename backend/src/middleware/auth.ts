import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import prisma from '../config/prisma';
import { ApiError } from '../utils/apiResponse';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'AUTH_REQUIRED', 'Authentication required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true, role: true, email: true, username: true },
    });

    if (!user) {
      throw new ApiError(401, 'USER_NOT_FOUND', 'User not found');
    }

    if (user.status === 'SUSPENDED') {
      throw new ApiError(403, 'ACCOUNT_SUSPENDED', 'Your account has been suspended');
    }

    if (user.status === 'INACTIVE') {
      throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Your account is inactive');
    }

    req.user = {
      userId: user.id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}

// Optional auth — doesn't fail if no token, but populates req.user if present
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, status: true, role: true, email: true },
    });

    if (user && user.status === 'ACTIVE') {
      req.user = { userId: user.id, role: user.role, email: user.email };
    }
    next();
  } catch {
    next();
  }
}

// Role-based guard — requires user to have one of the specified roles
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'AUTH_REQUIRED', 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'INSUFFICIENT_ROLE', 'Insufficient permissions for this action'));
    }
    next();
  };
}
