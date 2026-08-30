import { Request, Response, NextFunction } from 'express';
import { TeacherService } from './teachers.service';
import { success, paginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export class TeacherController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = getPagination(req);
      const search = req.query.search as string;
      const schoolId = req.query.schoolId as string;
      const subjectId = req.query.subjectId as string;

      const { teachers, total } = await TeacherService.findAll({
        search,
        schoolId,
        subjectId,
        skip,
        limit,
      });

      res.json(paginated(teachers, total, page, limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const teacher = await TeacherService.findById(req.params.id);
      res.json(success(teacher));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const teacher = await TeacherService.create(req.body);
      res.status(201).json(success(teacher));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const teacher = await TeacherService.update(req.params.id, req.body, req.user);
      res.json(success(teacher));
    } catch (error) {
      next(error);
    }
  }

  static async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const classes = await TeacherService.getClasses(req.params.id);
      res.json(success(classes));
    } catch (error) {
      next(error);
    }
  }

  static async getLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = req.query.classId as string;
      const subjectId = req.query.subjectId as string;
      const lessons = await TeacherService.getLessons(req.params.id, { classId, subjectId });
      res.json(success(lessons));
    } catch (error) {
      next(error);
    }
  }
}
