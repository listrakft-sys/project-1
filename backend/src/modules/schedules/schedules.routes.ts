import { Router } from 'express';
import { ScheduleController } from './schedules.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createScheduleSchema, updateScheduleSchema, createBulkScheduleSchema } from './schedules.schema';

const router = Router();

router.use(authenticate);

// GET /schedules (filter: classId, dayOfWeek, schoolId, teacherId, subjectId)
router.get('/', ScheduleController.findAll);

// GET /schedules/class/:classId (full week schedule for a class)
router.get('/class/:classId', ScheduleController.findByClass);

// POST /schedules (admin only)
router.post(
  '/',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  validate(createScheduleSchema),
  ScheduleController.create
);

// POST /schedules/bulk (admin only)
router.post(
  '/bulk',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  validate(createBulkScheduleSchema),
  ScheduleController.createBulk
);

// GET /schedules/:id
router.get('/:id', ScheduleController.findById);

// PUT /schedules/:id (admin only)
router.put(
  '/:id',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  validate(updateScheduleSchema),
  ScheduleController.update
);

// DELETE /schedules/:id (admin only)
router.delete(
  '/:id',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  ScheduleController.delete
);

export default router;
