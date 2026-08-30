import { Router } from 'express';
import { MessageController } from './messages.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { messageRateLimiter } from '../../middleware/rateLimiter';
import { sendMessageSchema, editMessageSchema } from './messages.schema';

const router = Router();

// All routes use authenticate
router.use(authenticate);

// GET /conversations/:id/messages (paginated messages)
router.get('/conversations/:id/messages', MessageController.findByConversation);

// POST /conversations/:id/messages (send — use messageRateLimiter)
router.post(
  '/conversations/:id/messages',
  messageRateLimiter,
  validate(sendMessageSchema),
  MessageController.send,
);

// PUT /messages/:id (edit — sender only)
router.put('/:id', validate(editMessageSchema), MessageController.edit);
router.put('/messages/:id', validate(editMessageSchema), MessageController.edit);

// DELETE /messages/:id (delete — sender only)
router.delete('/:id', MessageController.delete);
router.delete('/messages/:id', MessageController.delete);

export default router;
