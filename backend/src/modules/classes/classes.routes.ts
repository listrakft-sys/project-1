import { Router } from 'express';
import { ClassController } from './classes.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import { createClassSchema, updateClassSchema, assignStudentSchema } from './classes.schema';

const router = Router();

router.use(authenticate);

// List & detail routes
router.get('/', ClassController.findAll);
router.get('/:id', ClassController.findById);
router.get('/:id/students', ClassController.getStudents);

// Admin write routes
router.post(
  '/',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('classes', 'create'),
  validate(createClassSchema),
  ClassController.create,
);

router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('classes', 'update'),
  validate(updateClassSchema),
  ClassController.update,
);

router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('classes', 'delete'),
  ClassController.delete,
);

// Admin student assignment routes
router.post(
  '/:id/students/:studentId',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('classes', 'update'),
  validate(assignStudentSchema),
  ClassController.assignStudent,
);

router.delete(
  '/:id/students/:studentId',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('classes', 'update'),
  ClassController.removeStudent,
);

export default router;
