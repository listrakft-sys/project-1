import { Router } from 'express';
import { ReportController } from './reports.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import { createReportSchema, updateReportSchema } from './reports.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student reports proxy endpoint
router.get('/students/:studentId/reports', requirePermission('reports', 'read'), ReportController.getStudentReports);
router.get('/:studentId/reports', requirePermission('reports', 'read'), ReportController.getStudentReports);

// Standard CRUD endpoints for reports
router.get('/', requirePermission('reports', 'read'), ReportController.findAll);
router.post(
  '/',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validate(createReportSchema),
  ReportController.create,
);
router.get('/:id', requirePermission('reports', 'read'), ReportController.findById);
router.put(
  '/:id',
  requirePermission('reports', 'update'),
  validate(updateReportSchema),
  ReportController.update,
);
router.delete('/:id', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), ReportController.delete);

export default router;
