import { Request, Response, NextFunction } from 'express';
import { SchoolService } from './schools.service';
import { success, paginated } from '../../utils/apiResponse';
import { getPagination, getSort } from '../../utils/pagination';

export class SchoolController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req);
      const sort = getSort(req, ['name', 'createdAt', 'city', 'country']);
      const sortField = Object.keys(sort)[0];
      const sortDir = Object.values(sort)[0] as 'asc' | 'desc';

      const search = (req.query.search as string) || undefined;

      const result = await SchoolService.findAll({
        ...pagination,
        search,
        sortBy: sortField,
        sortDir,
      });

      return res.json(paginated(result.schools, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const school = await SchoolService.findById(req.params.id);
      return res.json(success(school));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const school = await SchoolService.create(req.body);
      return res.status(201).json(success(school));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const school = await SchoolService.update(req.params.id, req.body);
      return res.json(success(school));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await SchoolService.delete(req.params.id);
      return res.json(success({ message: 'School deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async getClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req);
      const search = (req.query.search as string) || undefined;
      const result = await SchoolService.findClasses(req.params.schoolId, {
        ...pagination,
        search,
      });
      return res.json(paginated(result.classes, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async getSubjects(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req);
      const search = (req.query.search as string) || undefined;
      const result = await SchoolService.findSubjects(req.params.schoolId, {
        ...pagination,
        search,
      });
      return res.json(paginated(result.subjects, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }
}
