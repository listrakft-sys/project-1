import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'));

// Dashboard stats
router.get('/stats', AdminController.getStats);
router.get('/recent-users', AdminController.getRecentUsers);
router.get('/activity', AdminController.getActivityLog);

// User management
router.put('/users/:userId/role', AdminController.updateUserRole);
router.put('/users/:userId/status', AdminController.updateUserStatus);

export default router;
