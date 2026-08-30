import { Request, Response, NextFunction } from 'express';
import { ClassService } from './classes.service';
import { success, paginated } from '../../utils/apiResponse';
import { getPagination, getSort } from '../../utils/pagination';

export class ClassController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req);
      const sort = getSort(req, ['name', 'grade', 'createdAt']);
      const sortField = Object.keys(sort)[0];
      const sortDir = Object.values(sort)[0] as 'asc' | 'desc';

      const schoolId = (req.query.schoolId as string) || undefined;
      const grade = req.query.grade ? parseInt(req.query.grade as string, 10) : undefined;
      const search = (req.query.search as string) || undefined;

      const result = await ClassService.findAll({
        ...pagination,
        schoolId,
        grade,
        search,
        sortBy: sortField,
        sortDir,
      });

      return res.json(paginated(result.classes, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const classRecord = await ClassService.findById(req.params.id);
      return res.json(success(classRecord));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const newClass = await ClassService.create(req.body);
      return res.status(201).json(success(newClass));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updatedClass = await ClassService.update(req.params.id, req.body);
      return res.json(success(updatedClass));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await ClassService.delete(req.params.id);
      return res.json(success({ message: 'Class deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async assignStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = req.params.id;
      const studentId = req.params.studentId || req.body.studentId;
      const result = await ClassService.assignStudent(classId, studentId);
      return res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async removeStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = req.params.id;
      const studentId = req.params.studentId;
      const result = await ClassService.removeStudent(classId, studentId);
      return res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = req.params.id;
      const pagination = getPagination(req);
      const search = (req.query.search as string) || undefined;
      const result = await ClassService.getStudents(classId, {
        ...pagination,
        search,
      });
      return res.json(paginated(result.students, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }
}
