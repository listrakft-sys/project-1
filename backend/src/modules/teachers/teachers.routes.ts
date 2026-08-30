import { Router } from 'express';
import { TeacherController } from './teachers.controller';
import { createTeacherSchema, updateTeacherSchema } from './teachers.schema';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(authenticate);

router.get('/', TeacherController.findAll);
router.post('/', requirePermission('teachers', 'create'), validate(createTeacherSchema), TeacherController.create);
router.get('/:id', TeacherController.findById);
router.put('/:id', validate(updateTeacherSchema), TeacherController.update);
router.get('/:id/classes', TeacherController.getClasses);
router.get('/:id/lessons', TeacherController.getLessons);

export default router;
