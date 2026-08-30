import { Request, Response, NextFunction } from 'express';
import { HomeworkService } from './homework.service';
import { success, paginated } from '../../utils/apiResponse';

export class HomeworkController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.findAll(req.query, req.user!);
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.findById(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.create(req.body, req.user!);
      res.status(201).json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.update(req.params.id, req.body, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.delete(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.getSubmissions(req.params.id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.submit(req.params.id, req.body, req.user!);
      res.status(201).json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async gradeSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.gradeSubmission(
        req.params.id,
        req.params.submissionId,
        req.body,
        req.user!
      );
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getStudentHomework(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HomeworkService.getStudentHomework(
        req.params.studentId,
        req.query,
        req.user!
      );
      res.json(paginated(result.data, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }
}
