import { Router } from 'express';
import { StudentController } from './students.controller';
import { createStudentSchema, updateStudentSchema } from './students.schema';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';

const router = Router();

router.use(authenticate);

router.get('/', StudentController.findAll);
router.post('/', requirePermission('students', 'create'), validate(createStudentSchema), StudentController.create);
router.get('/:id', StudentController.findById);
router.put('/:id', validate(updateStudentSchema), StudentController.update);
router.get('/:id/homework', StudentController.getHomework);
router.get('/:id/reports', StudentController.getReports);

export default router;
