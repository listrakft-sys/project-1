import { Router } from 'express';
import { ComplaintController } from './complaints.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createComplaintSchema, handleComplaintSchema } from './complaints.schema';

const router = Router();

router.use(authenticate);

// GET /complaints (admin only)
router.get(
  '/',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  ComplaintController.findAll
);

// POST /complaints (any authenticated user)
router.post(
  '/',
  validate(createComplaintSchema),
  ComplaintController.create
);

// GET /complaints/:id (filer or admin)
router.get('/:id', ComplaintController.findById);

// PUT /complaints/:id (admin only — handle/resolve)
router.put(
  '/:id',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  validate(handleComplaintSchema),
  ComplaintController.handle
);

export default router;
