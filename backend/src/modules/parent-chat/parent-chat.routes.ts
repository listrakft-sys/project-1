import { Router } from 'express';
import { ParentChatController } from './parent-chat.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Parent-only routes
router.get('/children', requireRole('PARENT'), ParentChatController.getChildren);
router.post('/link', requireRole('PARENT', 'SUPER_ADMIN', 'SCHOOL_ADMIN'), ParentChatController.linkChild);
router.delete('/unlink/:studentId', requireRole('PARENT', 'SUPER_ADMIN', 'SCHOOL_ADMIN'), ParentChatController.unlinkChild);
router.get('/teachers', requireRole('PARENT'), ParentChatController.getTeachers);

// Both parents and teachers can access
router.post('/start', requireRole('PARENT', 'TEACHER'), ParentChatController.startChat);
router.get('/conversations', requireRole('PARENT', 'TEACHER'), ParentChatController.getConversations);

export default router;
