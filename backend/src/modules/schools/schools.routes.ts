import { Router } from 'express';
import { SchoolController } from './schools.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import { createSchoolSchema, updateSchoolSchema } from './schools.schema';

const router = Router();

router.use(authenticate);

// List and detail routes
router.get('/', SchoolController.findAll);
router.get('/:schoolId/classes', SchoolController.getClasses);
router.get('/:schoolId/subjects', SchoolController.getSubjects);
router.get('/:id', SchoolController.findById);

// Admin write routes
router.post(
  '/',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('schools', 'create'),
  validate(createSchoolSchema),
  SchoolController.create,
);

router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('schools', 'update'),
  validate(updateSchoolSchema),
  SchoolController.update,
);

router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  requirePermission('schools', 'delete'),
  SchoolController.delete,
);

export default router;
