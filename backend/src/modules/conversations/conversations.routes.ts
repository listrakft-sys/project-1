import { Router } from 'express';
import { ConversationController } from './conversations.controller';
import { MessageController } from '../messages/messages.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { messageRateLimiter } from '../../middleware/rateLimiter';
import {
  createConversationSchema,
  updateConversationSchema,
  addParticipantSchema,
} from './conversations.schema';
import { sendMessageSchema } from '../messages/messages.schema';

const router = Router();

// All routes use authenticate
router.use(authenticate);

// GET /conversations (list user's conversations)
router.get('/', ConversationController.findAll);

// POST /conversations (create — check privacy & blocked before allowing)
router.post('/', validate(createConversationSchema), ConversationController.create);

// GET /conversations/unread (get unread counts) — placed before /:id to prevent matching
router.get('/unread', ConversationController.getUnreadCount);

// GET /conversations/:id (get with messages, paginated)
router.get('/:id', ConversationController.findById);

// PUT /conversations/:id (update — admin of conversation)
router.put('/:id', validate(updateConversationSchema), ConversationController.update);

// DELETE /conversations/:id (leave conversation)
router.delete('/:id', ConversationController.leave);

// POST /conversations/:id/participants (add participant — admin only)
router.post('/:id/participants', validate(addParticipantSchema), ConversationController.addParticipant);

// DELETE /conversations/:id/participants/:userId (remove participant)
router.delete('/:id/participants/:userId', ConversationController.removeParticipant);

// POST /conversations/:id/read (mark as read)
router.post('/:id/read', ConversationController.markAsRead);

// GET /conversations/:id/messages (paginated messages)
router.get('/:id/messages', MessageController.findByConversation);

// POST /conversations/:id/messages (send — use messageRateLimiter)
router.post(
  '/:id/messages',
  messageRateLimiter,
  validate(sendMessageSchema),
  MessageController.send,
);

export default router;
