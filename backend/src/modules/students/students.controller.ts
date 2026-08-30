import { Request, Response, NextFunction } from 'express';
import { StudentService } from './students.service';
import { success, paginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export class StudentController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPagination(req);
      const search = req.query.search as string;
      const schoolId = req.query.schoolId as string;
      const classId = req.query.classId as string;

      const { students, total } = await StudentService.findAll(
        { search, schoolId, classId, skip, limit },
        req.user,
      );

      res.json(paginated(students, total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.findById(req.params.id, req.user);
      res.json(success(student));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.create(req.body);
      res.status(201).json(success(student));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const student = await StudentService.update(req.params.id, req.body, req.user);
      res.json(success(student));
    } catch (error) {
      next(error);
    }
  }

  static async getHomework(req: Request, res: Response, next: NextFunction) {
    try {
      const homework = await StudentService.getHomework(req.params.id, req.user);
      res.json(success(homework));
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const reports = await StudentService.getReports(req.params.id, req.user);
      res.json(success(reports));
    } catch (error) {
      next(error);
    }
  }
}
