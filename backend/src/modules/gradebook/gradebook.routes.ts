import { Router } from 'express';
import { GradebookController } from './gradebook.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// ── Grades ─────────────────────────────────────────────────
// Teachers + admins can create/edit grades
router.post('/grades', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), GradebookController.createGrade);
router.post('/grades/bulk', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), GradebookController.bulkCreateGrades);
router.get('/students/:studentId/grades', GradebookController.getStudentGrades);
router.get('/classes/:classId/grades', GradebookController.getStudentGrades); // alias
router.get('/classes/:classId/grades/overview', GradebookController.getClassGrades);
router.put('/grades/:gradeId', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), GradebookController.updateGrade);
router.delete('/grades/:gradeId', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), GradebookController.deleteGrade);
router.get('/students/:studentId/average', GradebookController.getStudentAverage);

// ── Attendance ─────────────────────────────────────────────
router.post('/attendance', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), GradebookController.markAttendance);
router.post('/attendance/bulk', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), GradebookController.bulkMarkAttendance);
router.get('/students/:studentId/attendance', GradebookController.getStudentAttendance);
router.get('/classes/:classId/attendance', GradebookController.getClassAttendance);
router.get('/students/:studentId/attendance/summary', GradebookController.getAttendanceSummary);

// ── Class Overview (gradebook view) ──────────────────────
router.get('/classes/:classId/subjects/:subjectId/overview', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), GradebookController.getClassOverview);

export default router;
