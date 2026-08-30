import { Router } from 'express';
import { AIController } from './ai.controller';
import { requireAIAccess } from './ai.middleware';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All AI routes require authentication + AI access
router.use(authenticate);
router.use(requireAIAccess);

// Conversations
router.post('/conversations', AIController.createConversation);
router.get('/conversations', AIController.getConversations);
router.get('/conversations/:conversationId', AIController.getConversation);
router.delete('/conversations/:conversationId', AIController.deleteConversation);

// Messages
router.post('/conversations/:conversationId/messages', AIController.sendMessage);
router.post('/messages/:messageId/feedback', AIController.provideFeedback);

// AI Tools (text analysis, content generation)
router.post('/analyze', AIController.analyzeText);
router.post('/generate', AIController.generateContent);

// Usage stats
router.get('/usage', AIController.getUsageStats);

export default router;
