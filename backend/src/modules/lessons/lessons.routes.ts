import { Router } from 'express';
import { LessonController } from './lessons.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import { createLessonSchema, updateLessonSchema } from './lessons.schema';

const router = Router();

router.use(authenticate);

// GET /lessons (with query filters)
router.get('/', LessonController.findAll);

// POST /lessons (teacher/admin with requirePermission)
router.post(
  '/',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requirePermission('lessons', 'create'),
  validate(createLessonSchema),
  LessonController.create
);

// GET /lessons/today
router.get('/today', LessonController.getToday);

// GET /lessons/upcoming
router.get('/upcoming', LessonController.getUpcoming);

// GET /lessons/:id
router.get('/:id', LessonController.findById);

// PUT /lessons/:id (teacher who owns or admin)
router.put(
  '/:id',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requirePermission('lessons', 'update'),
  validate(updateLessonSchema),
  LessonController.update
);

// DELETE /lessons/:id (teacher who owns or admin)
router.delete(
  '/:id',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requirePermission('lessons', 'delete'),
  LessonController.delete
);

export default router;
