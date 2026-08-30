import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from './schedules.service';
import { success, paginated } from '../../utils/apiResponse';

export class ScheduleController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ScheduleService.findAll(req.query);
      res.json(paginated(result.schedules, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.findById(req.params.id);
      res.json(success(schedule));
    } catch (error) {
      next(error);
    }
  }

  static async findByClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ScheduleService.findByClass(req.params.classId);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.create(req.body);
      res.status(201).json(success(schedule));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.update(req.params.id, req.body);
      res.json(success(schedule));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ScheduleService.delete(req.params.id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const schedules = await ScheduleService.createBulk(req.body);
      res.status(201).json(success(schedules));
    } catch (error) {
      next(error);
    }
  }
}
