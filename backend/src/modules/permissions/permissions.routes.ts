import { Router } from 'express';
import { PermissionController } from './permissions.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createPermissionSchema, updateUserPermissionSchema } from './permissions.schema';

const router = Router();

router.use(authenticate);

// GET /permissions (admin)
router.get(
  '/',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  PermissionController.findAll
);

// POST /permissions (super admin only)
router.post(
  '/',
  requireRole('SUPER_ADMIN'),
  validate(createPermissionSchema),
  PermissionController.create
);

// GET /users/:id/permissions
router.get(
  '/users/:id',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  PermissionController.getUserPermissions
);

// PUT /users/:id/permissions (admin)
router.put(
  '/users/:id',
  requireRole('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  validate(updateUserPermissionSchema),
  PermissionController.updateUserPermission
);

export default router;
