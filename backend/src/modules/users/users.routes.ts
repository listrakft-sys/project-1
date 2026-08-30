import { Router } from 'express';
import { UserController } from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import {
  updateUserSchema,
  updateProfileSchema,
  updatePrivacySchema,
  blockUserSchema,
} from './users.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Specific routes before parametric /:id routes
router.get('/blocked', UserController.getBlockedUsers);
router.get('/username/:username', UserController.findByUsername);
router.get('/', UserController.findAll);

// Profile and privacy settings routes
router.get('/:id/profile', UserController.getProfile);
router.put('/:id/profile', validate(updateProfileSchema), UserController.updateProfile);
router.put('/:id/privacy', validate(updatePrivacySchema), UserController.updatePrivacySettings);

// Block / unblock routes
router.post('/:id/block', validate(blockUserSchema), UserController.blockUser);
router.delete('/:id/block', UserController.unblockUser);

// User CRUD routes
router.get('/:id', UserController.findById);
router.put('/:id', validate(updateUserSchema), UserController.updateUser);
router.delete('/:id', requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'), UserController.deleteUser);

export default router;
