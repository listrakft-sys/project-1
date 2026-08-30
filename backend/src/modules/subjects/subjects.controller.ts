import { Request, Response, NextFunction } from 'express';
import { SubjectService } from './subjects.service';
import { success, paginated } from '../../utils/apiResponse';
import { getPagination, getSort } from '../../utils/pagination';

export class SubjectController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req);
      const sort = getSort(req, ['name', 'code', 'createdAt', 'updatedAt']);
      const sortField = Object.keys(sort)[0];
      const sortDir = Object.values(sort)[0] as 'asc' | 'desc';

      const schoolId = (req.query.schoolId as string) || undefined;
      const language = (req.query.language as string) || undefined;
      const search = (req.query.search as string) || undefined;

      const result = await SubjectService.findAll({
        ...pagination,
        schoolId,
        language,
        search,
        sortBy: sortField,
        sortDir,
      });

      return res.json(paginated(result.subjects, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = await SubjectService.findById(req.params.id);
      return res.json(success(subject));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = await SubjectService.create(req.body);
      return res.status(201).json(success(subject));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const subject = await SubjectService.update(req.params.id, req.body);
      return res.json(success(subject));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SubjectService.delete(req.params.id);
      return res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async assignTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const subjectId = req.params.id;
      const teacherId = req.params.teacherId || req.body.teacherId;
      const result = await SubjectService.assignTeacher(subjectId, teacherId);
      return res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async removeTeacher(req: Request, res: Response, next: NextFunction) {
    try {
      const subjectId = req.params.id;
      const teacherId = req.params.teacherId;
      const result = await SubjectService.removeTeacher(subjectId, teacherId);
      return res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}
