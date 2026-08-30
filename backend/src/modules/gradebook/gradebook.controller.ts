import { Request, Response, NextFunction } from 'express';
import { GradebookService } from './gradebook.service';
import { success } from '../../utils/apiResponse';
import { GradeType, AttendanceStatus } from '@prisma/client';

export class GradebookController {
  // ── GRADES ──────────────────────────────────────────────

  static async createGrade(req: Request, res: Response, next: NextFunction) {
    try {
      const grade = await GradebookService.createGrade({
        ...req.body,
        teacherId: req.user!.userId, // teacher ID from token
      });
      res.status(201).json(success(grade, { message: 'Grade created' }));
    } catch (error) {
      next(error);
    }
  }

  static async bulkCreateGrades(req: Request, res: Response, next: NextFunction) {
    try {
      const grades = req.body.grades?.map((g: any) => ({
        ...g,
        teacherId: req.user!.userId,
      }));
      if (!grades || grades.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_GRADES', message: 'No grades provided' },
        });
      }
      const result = await GradebookService.bulkCreateGrades(grades);
      res.status(201).json(success(result, { message: `${result.count} grades created` }));
    } catch (error) {
      next(error);
    }
  }

  static async getStudentGrades(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { subjectId, term, type } = req.query;
      const grades = await GradebookService.getStudentGrades(studentId, {
        subjectId: subjectId as string,
        term: term as string,
        type: type as GradeType,
      });
      res.json(success(grades));
    } catch (error) {
      next(error);
    }
  }

  static async getClassGrades(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const { subjectId, term, date } = req.query;
      const grades = await GradebookService.getClassGrades(classId, {
        subjectId: subjectId as string,
        term: term as string,
        date: date as string,
      });
      res.json(success(grades));
    } catch (error) {
      next(error);
    }
  }

  static async updateGrade(req: Request, res: Response, next: NextFunction) {
    try {
      const { gradeId } = req.params;
      const grade = await GradebookService.updateGrade(gradeId, req.user!.userId, req.body);
      res.json(success(grade, { message: 'Grade updated' }));
    } catch (error) {
      next(error);
    }
  }

  static async deleteGrade(req: Request, res: Response, next: NextFunction) {
    try {
      const { gradeId } = req.params;
      const result = await GradebookService.deleteGrade(gradeId, req.user!.userId);
      res.json(success(result, { message: 'Grade deleted' }));
    } catch (error) {
      next(error);
    }
  }

  static async getStudentAverage(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { subjectId, term } = req.query;
      const average = await GradebookService.getStudentAverage(
        studentId,
        subjectId as string,
        term as string,
      );
      res.json(success(average));
    } catch (error) {
      next(error);
    }
  }

  // ── ATTENDANCE ──────────────────────────────────────────

  static async markAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await GradebookService.markAttendance({
        ...req.body,
        teacherId: req.user!.userId,
      });
      res.status(201).json(success(record, { message: 'Attendance marked' }));
    } catch (error) {
      next(error);
    }
  }

  static async bulkMarkAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const records = req.body.records?.map((r: any) => ({
        ...r,
        teacherId: req.user!.userId,
      }));
      if (!records || records.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_RECORDS', message: 'No attendance records provided' },
        });
      }
      const result = await GradebookService.bulkMarkAttendance(records);
      res.status(201).json(success(result, { message: `${result.marked}/${result.total} marked` }));
    } catch (error) {
      next(error);
    }
  }

  static async getStudentAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { classId, status } = req.query;
      const records = await GradebookService.getStudentAttendance(studentId, {
        classId: classId as string,
        status: status as AttendanceStatus,
      });
      res.json(success(records));
    } catch (error) {
      next(error);
    }
  }

  static async getClassAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.params;
      const dateStr = req.query.date as string;
      const date = dateStr ? new Date(dateStr) : new Date();
      const records = await GradebookService.getClassAttendance(classId, date);
      res.json(success(records));
    } catch (error) {
      next(error);
    }
  }

  static async getAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const { term } = req.query;
      const summary = await GradebookService.getAttendanceSummary(studentId, term as string);
      res.json(success(summary));
    } catch (error) {
      next(error);
    }
  }

  // ── CLASS OVERVIEW ──────────────────────────────────────

  static async getClassOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId, subjectId } = req.params;
      const term = (req.query.term as string) || '1';
      const overview = await GradebookService.getClassOverview(classId, subjectId, term);
      res.json(success(overview));
    } catch (error) {
      next(error);
    }
  }
}
