import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from './announcements.service';
import { success, paginated } from '../../utils/apiResponse';

export class AnnouncementController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnnouncementService.findAll(req.query, req.user!);
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnnouncementService.getFeed(req.query, req.user!);
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnnouncementService.findById(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnnouncementService.create(req.body, req.user!);
      res.status(201).json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnnouncementService.update(req.params.id, req.body, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnnouncementService.delete(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async pin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AnnouncementService.pin(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}
