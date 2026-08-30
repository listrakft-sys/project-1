import { Router } from 'express';
import { SubjectController } from './subjects.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import { createSubjectSchema, updateSubjectSchema } from './subjects.schema';

const router = Router();

router.use(authenticate);

// GET /subjects
router.get('/', SubjectController.findAll);

// POST /subjects (admin)
router.post(
  '/',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('subjects', 'create'),
  validate(createSubjectSchema),
  SubjectController.create
);

// GET /subjects/:id
router.get('/:id', SubjectController.findById);

// PUT /subjects/:id (admin)
router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('subjects', 'update'),
  validate(updateSubjectSchema),
  SubjectController.update
);

// DELETE /subjects/:id (admin)
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('subjects', 'delete'),
  SubjectController.delete
);

// POST /subjects/:id/teachers/:teacherId (admin)
router.post(
  '/:id/teachers/:teacherId',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('subjects', 'update'),
  SubjectController.assignTeacher
);

// DELETE /subjects/:id/teachers/:teacherId (admin)
router.delete(
  '/:id/teachers/:teacherId',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('subjects', 'update'),
  SubjectController.removeTeacher
);

export default router;
