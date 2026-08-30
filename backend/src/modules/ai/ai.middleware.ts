import { Request, Response, NextFunction } from 'express';

/**
 * Permission middleware for AI module.
 * All authenticated users can use AI assistant.
 */
export function requireAIAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'AI access not available for your role' },
    });
  }

  next();
}
