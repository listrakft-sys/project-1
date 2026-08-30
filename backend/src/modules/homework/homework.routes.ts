import { Router } from 'express';
import { HomeworkController } from './homework.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import {
  createHomeworkSchema,
  updateHomeworkSchema,
  submitHomeworkSchema,
  gradeSubmissionSchema,
} from './homework.schema';

const router = Router();

router.use(authenticate);

// GET /homework (filters: classId, subjectId, studentId, status)
router.get('/', HomeworkController.findAll);

// POST /homework (teacher/admin — requirePermission('homework','create'))
router.post(
  '/',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requirePermission('homework', 'create'),
  validate(createHomeworkSchema),
  HomeworkController.create
);

// GET /homework/student/:studentId (get all homework for a student with their submission status)
// Declared before /:id so 'student' is not parsed as an id parameter
router.get('/student/:studentId', HomeworkController.getStudentHomework);

// GET /homework/:id
router.get('/:id', HomeworkController.findById);

// PUT /homework/:id (teacher/owner or admin)
router.put(
  '/:id',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requirePermission('homework', 'update'),
  validate(updateHomeworkSchema),
  HomeworkController.update
);

// DELETE /homework/:id (teacher/owner or admin)
router.delete(
  '/:id',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  requirePermission('homework', 'delete'),
  HomeworkController.delete
);

// GET /homework/:id/submissions (teacher only)
router.get(
  '/:id/submissions',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  HomeworkController.getSubmissions
);

// POST /homework/:id/submit (student only — submit their work)
router.post(
  '/:id/submit',
  requireRole('STUDENT'),
  validate(submitHomeworkSchema),
  HomeworkController.submit
);

// PUT /homework/:id/submissions/:submissionId (teacher only — grade the submission)
router.put(
  '/:id/submissions/:submissionId',
  requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'),
  validate(gradeSubmissionSchema),
  HomeworkController.gradeSubmission
);

export default router;
