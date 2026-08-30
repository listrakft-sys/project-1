import { Request, Response, NextFunction } from 'express';
import { LessonService } from './lessons.service';
import { success, paginated } from '../../utils/apiResponse';

export class LessonController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LessonService.findAll(req.query);
      return res.json(paginated(result.lessons, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const lesson = await LessonService.findById(req.params.id);
      return res.json(success(lesson));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const lesson = await LessonService.create(req.body, req.user!);
      return res.status(201).json(success(lesson));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const lesson = await LessonService.update(req.params.id, req.body, req.user!);
      return res.json(success(lesson));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await LessonService.delete(req.params.id, req.user!);
      return res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getToday(req: Request, res: Response, next: NextFunction) {
    try {
      const lessons = await LessonService.getToday(req.user!);
      return res.json(success(lessons));
    } catch (error) {
      next(error);
    }
  }

  static async getUpcoming(req: Request, res: Response, next: NextFunction) {
    try {
      const lessons = await LessonService.getUpcoming(req.user!);
      return res.json(success(lessons));
    } catch (error) {
      next(error);
    }
  }
}
