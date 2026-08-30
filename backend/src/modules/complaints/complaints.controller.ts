import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from './complaints.service';
import { success, paginated } from '../../utils/apiResponse';

export class ComplaintController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ComplaintService.findAll(req.query, req.user!);
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ComplaintService.findById(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ComplaintService.create(req.body, req.user!);
      res.status(201).json(success(result, { message: 'Complaint created successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async handle(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ComplaintService.handle(req.params.id, req.body, req.user!);
      res.json(success(result, { message: 'Complaint updated successfully' }));
    } catch (error) {
      next(error);
    }
  }
}
