import { Request, Response, NextFunction } from 'express';
import { AIService } from './ai.service';
import { success } from '../../utils/apiResponse';

export class AIController {
  static async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, title, context } = req.body;
      const conversation = await AIService.createConversation(
        req.user!.userId,
        type,
        title,
        context,
      );
      res.status(201).json(success(conversation, { message: 'Conversation created' }));
    } catch (error) {
      next(error);
    }
  }

  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await AIService.getConversations(req.user!.userId, page, limit);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;
      const conversation = await AIService.getConversation(conversationId, req.user!.userId);
      res.json(success(conversation));
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Message content is required' },
        });
      }

      if (content.length > 4000) {
        return res.status(400).json({
          success: false,
          error: { code: 'MESSAGE_TOO_LONG', message: 'Message must be under 4000 characters' },
        });
      }

      const result = await AIService.sendMessage(
        conversationId,
        req.user!.userId,
        req.user!.role,
        content,
      );
      res.json(success(result, { message: 'AI response generated' }));
    } catch (error) {
      next(error);
    }
  }

  static async deleteConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = req.params;
      const result = await AIService.deleteConversation(conversationId, req.user!.userId);
      res.json(success(result, { message: 'Conversation deleted' }));
    } catch (error) {
      next(error);
    }
  }

  static async provideFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const { feedback } = req.body;
      const result = await AIService.provideFeedback(messageId, req.user!.userId, feedback);
      res.json(success(result, { message: 'Feedback recorded' }));
    } catch (error) {
      next(error);
    }
  }

  static async analyzeText(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, analysisType } = req.body;
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Text is required' },
        });
      }
      const result = await AIService.analyzeText(
        req.user!.userId,
        req.user!.role,
        text,
        analysisType || 'summary',
      );
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async generateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { contentType, topic, level } = req.body;
      if (!contentType || !topic) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Content type and topic are required' },
        });
      }
      const result = await AIService.generateContent(
        req.user!.userId,
        req.user!.role,
        contentType,
        topic,
        level || 'general',
      );
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getUsageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AIService.getUsageStats(req.user!.userId);
      res.json(success(stats));
    } catch (error) {
      next(error);
    }
  }
}
