import { Request, Response, NextFunction } from 'express';
import { ReportService } from './reports.service';
import { success, paginated } from '../../utils/apiResponse';

export class ReportController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReportService.findAll(req.query, req.user!);
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReportService.findById(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReportService.create(req.body, req.user!);
      res.status(201).json(success(result, { message: 'Report created successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReportService.update(req.params.id, req.body, req.user!);
      res.json(success(result, { message: 'Report updated successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ReportService.delete(req.params.id, req.user!);
      res.json(success({ message: 'Report deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async getStudentReports(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ReportService.findByStudentId(req.params.studentId, req.query, req.user!);
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }
}
