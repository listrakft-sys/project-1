import { Request, Response, NextFunction } from 'express';
import { ExportService } from './export.service';

export class ExportController {
  /**
   * GET /export/grades/:studentId
   */
  static async exportStudentGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const classId = req.query.classId as string | undefined;

      const pdfDoc = await ExportService.generateGradeReport(studentId, classId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="grade_report_${studentId}.pdf"`);

      pdfDoc.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /export/attendance/:studentId
   */
  static async exportStudentAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { studentId } = req.params;
      const classId = req.query.classId as string | undefined;

      const pdfDoc = await ExportService.generateAttendanceReport(studentId, classId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${studentId}.pdf"`);

      pdfDoc.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /export/class/:classId
   */
  static async exportClassReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.params;

      const pdfDoc = await ExportService.generateClassReport(classId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="class_report_${classId}.pdf"`);

      pdfDoc.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}
