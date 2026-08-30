import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { success } from '../../utils/apiResponse';

export class AdminController {
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolId = req.query.schoolId as string | undefined;
      const stats = await AdminService.getStats(schoolId);
      res.json(success(stats));
    } catch (error) {
      next(error);
    }
  }

  static async getRecentUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const users = await AdminService.getRecentUsers(limit);
      res.json(success(users));
    } catch (error) {
      next(error);
    }
  }

  static async getActivityLog(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const log = await AdminService.getActivityLog(limit);
      res.json(success(log));
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const result = await AdminService.updateUserRole(userId, role, req.user!.userId);
      res.json(success(result, { message: 'User role updated' }));
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      const result = await AdminService.updateUserStatus(userId, status, req.user!.userId);
      res.json(success(result, { message: 'User status updated' }));
    } catch (error) {
      next(error);
    }
  }
}
