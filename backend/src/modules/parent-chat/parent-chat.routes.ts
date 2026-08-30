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

// Parent group chat routes (parents only)
router.get('/groups', requireRole('PARENT'), ParentChatController.getGroupConversations);
router.get('/available-groups', requireRole('PARENT'), ParentChatController.getAvailableGroups);
router.post('/groups', requireRole('PARENT'), ParentChatController.createOrJoinGroup);

// Both parents and teachers can access 1-on-1 parent-teacher chat
router.post('/start', requireRole('PARENT', 'TEACHER'), ParentChatController.startChat);
router.get('/conversations', requireRole('PARENT', 'TEACHER'), ParentChatController.getConversations);

export default router;
