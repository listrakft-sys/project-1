import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notifications.service';
import { success, paginated } from '../../utils/apiResponse';

export class NotificationController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.findAll(req.query, req.user!);
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.getUnreadCount(req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markAsRead(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markAllAsRead(req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.delete(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}
