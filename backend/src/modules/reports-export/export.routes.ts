import { Router } from 'express';
import { ExportController } from './export.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /export/grades/:studentId — PDF отчёт по оценкам
router.get('/grades/:studentId', ExportController.exportStudentGrades);

// GET /export/attendance/:studentId — PDF отчёт по посещаемости
router.get('/attendance/:studentId', ExportController.exportStudentAttendance);

// GET /export/class/:classId — PDF отчёт по классу (только учителя и админы)
router.get('/class/:classId', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), ExportController.exportClassReport);

export default router;
